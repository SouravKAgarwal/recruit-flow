"use server";

import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { z } from "zod";
import { runModernCampaign } from "@/lib/mailer";
import { rateLimit, enforceRateLimit } from "@/lib/rate-limit";
import type { SmtpAccount, Prisma } from "@prisma/client";

export type EmailHistoryResult = Prisma.EmailLogGetPayload<{
  include: { recruiter: true; template: true; resume: true };
}> & {
  smtpAccount: SmtpAccount | null;
};

/**
 * Fetches all campaigns for the currently authenticated user.
 *
 * @returns List of campaigns ordered by creation date descending.
 */
export async function getCampaigns() {
  const { userId } = await requireAuth();
  return getCachedCampaigns(userId);
}

async function getCachedCampaigns(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("campaigns", userId);

  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { smtpAccount: true, template: true },
  });
}

export type CampaignActionState =
  | {
      success?: boolean;
      error?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  smtpAccountId: z.string().min(1, "SMTP Account is required"),
  templateId: z.string().min(1, "Template is required"),
});

/**
 * Creates a new email campaign.
 *
 * @param prevState - Previous form state
 * @param formData - Campaign details including name, smtp account, and template
 * @returns Success or error details
 */
export async function createCampaign(
  prevState: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  try {
    await enforceRateLimit("create_campaign");
    const { userId } = await requireAuth();

  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, smtpAccountId, templateId } = parsed.data;

    await prisma.campaign.create({
      data: {
        userId,
        name,
        smtpAccountId,
        templateId,
      },
    });

    revalidatePath("/campaigns");
    revalidateTag("campaigns", "hours");
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || "Failed to create campaign" };
  }
}

/**
 * Triggers a campaign execution asynchronously.
 * Uses rate limiting to prevent spamming campaign triggers.
 *
 * @param campaignId - The ID of the campaign to start
 * @returns Execution start status
 */
export async function triggerCampaign(campaignId: string) {
  try {
    await enforceRateLimit("trigger_campaign");
  } catch (err: any) {
    return { error: err.message };
  }

  const { userId } = await requireAuth();

  if (!campaignId) {
    throw new Error("Missing campaign ID");
  }

  // Instantly update status to show UI feedback without polling
  await prisma.campaign.update({
    where: { id: campaignId, userId },
    data: { status: "RUNNING" },
  });

  runModernCampaign(campaignId).catch((err) => {
    console.error(
      `Background campaign execution for ${campaignId} failed:`,
      err,
    );
  });

  revalidatePath("/campaigns");
  revalidateTag("campaigns", "hours");
  return { success: true, message: "Campaign started successfully." };
}

/**
 * Deletes a campaign and unlinks associated email logs.
 *
 * @param id - The ID of the campaign to delete
 */
export async function deleteCampaign(id: string) {
  await enforceRateLimit("delete_campaign");
  const { userId } = await requireAuth();
  await prisma.emailLog.updateMany({
    where: { campaignId: id, userId },
    data: { campaignId: null },
  });
  await prisma.campaign.deleteMany({
    where: { id, userId },
  });
  revalidatePath("/campaigns");
  revalidateTag("campaigns", "hours");
}

/**
 * Fetches the recent email history (logs) for the authenticated user.
 *
 * @returns Up to 200 recent email logs with populated relations.
 */

export async function getEmailHistory(): Promise<EmailHistoryResult[]> {
  const { userId } = await requireAuth();
  return getCachedEmailHistory(userId);
}

async function getCachedEmailHistory(userId: string): Promise<EmailHistoryResult[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("history", userId);

  const logs = await prisma.emailLog.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: 200,
    include: { recruiter: true, template: true, resume: true },
  });

  const smtpIds = [
    ...new Set(logs.map((l: any) => l.smtpAccountId).filter(Boolean)),
  ] as string[];
  const smtps: SmtpAccount[] = await prisma.smtpAccount.findMany({
    where: { id: { in: smtpIds } },
  });

  const smtpMap = Object.fromEntries(smtps.map((s) => [s.id, s]));

  return logs.map((log: any) => ({
    ...log,
    smtpAccount: log.smtpAccountId ? smtpMap[log.smtpAccountId] : null,
  }));
}
