"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function getCampaigns() {
  const { userId } = await requireAuth();
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { smtpAccount: true, template: true },
  });
}

import { z } from "zod";

export type CampaignActionState = {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
} | undefined;

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  smtpAccountId: z.string().min(1, "SMTP Account is required"),
  templateId: z.string().min(1, "Template is required"),
  delayMs: z.coerce.number().min(500, "Delay must be at least 500ms"),
});

export async function createCampaign(prevState: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  const { userId } = await requireAuth();

  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, smtpAccountId, templateId, delayMs } = parsed.data;

  try {
    await prisma.campaign.create({
      data: {
        userId,
        name,
        smtpAccountId,
        templateId,
        delayMs,
      },
    });

    revalidatePath("/campaigns");
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || "Failed to create campaign" };
  }
}

export async function deleteCampaign(id: string) {
  const { userId } = await requireAuth();
  await prisma.emailLog.updateMany({
    where: { campaignId: id, userId },
    data: { campaignId: null },
  });
  await prisma.campaign.deleteMany({
    where: { id, userId },
  });
  revalidatePath("/campaigns");
}

export async function bulkDeleteCampaigns(ids: string[]) {
  const { userId } = await requireAuth();
  await prisma.emailLog.updateMany({
    where: { campaignId: { in: ids }, userId },
    data: { campaignId: null },
  });
  await prisma.campaign.deleteMany({
    where: { id: { in: ids }, userId },
  });
  revalidatePath("/campaigns");
}

export async function getEmailHistory() {
  const { userId } = await requireAuth();
  const logs = await prisma.emailLog.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: 200,
    include: { recruiter: true, template: true, resume: true },
  });

  const smtpIds = [...new Set(logs.map(l => l.smtpAccountId).filter(Boolean))] as string[];
  const smtps = await prisma.smtpAccount.findMany({
    where: { id: { in: smtpIds } },
  });

  const smtpMap = Object.fromEntries(smtps.map(s => [s.id, s]));

  return logs.map(log => ({
    ...log,
    smtpAccount: log.smtpAccountId ? smtpMap[log.smtpAccountId] : null,
  }));
}

export async function getAnalytics() {
  const { userId } = await requireAuth();

  const [total, opened, replied, recruiters] = await Promise.all([
    prisma.emailLog.count({ where: { userId } }),
    prisma.emailLog.count({ where: { userId, openedAt: { not: null } } }),
    prisma.emailLog.count({ where: { userId, repliedAt: { not: null } } }),
    prisma.recruiter.count({ where: { userId } }),
  ]);

  // Last 14 days activity
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const recentLogs = await prisma.emailLog.findMany({
    where: { userId, sentAt: { gte: since } },
    select: { sentAt: true },
  });

  const dailyCounts: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const log of recentLogs) {
    const day = log.sentAt.toISOString().slice(0, 10);
    if (day in dailyCounts) dailyCounts[day]++;
  }

  return {
    totalSent: total,
    openRate: total ? Math.round((opened / total) * 100) : 0,
    replyRate: total ? Math.round((replied / total) * 100) : 0,
    totalRecruiters: recruiters,
    dailyActivity: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
  };
}
