"use server";

import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { EmailTemplate } from "@prisma/client";

export async function getTemplates(): Promise<EmailTemplate[]> {
  const { userId } = await requireAuth();
  return getCachedTemplates(userId);
}

async function getCachedTemplates(userId: string): Promise<EmailTemplate[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("templates", userId);

  return prisma.emailTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createTemplate(data: {
  name: string;
  subject: string;
  body: string;
}) {
  await enforceRateLimit("create_template");
  const { userId } = await requireAuth();
  const tpl = await prisma.emailTemplate.create({
    data: { userId, ...data },
  });
  revalidatePath("/templates");
  revalidateTag("templates", "hours");
  return tpl;
}

export async function updateTemplate(
  id: string,
  data: { name?: string; subject?: string; body?: string },
) {
  await enforceRateLimit("update_template");
  const { userId } = await requireAuth();
  await prisma.emailTemplate.updateMany({ where: { id, userId }, data });
  revalidatePath("/templates");
  revalidateTag("templates", "hours");
}

export async function deleteTemplate(id: string) {
  await enforceRateLimit("delete_template");
  const { userId } = await requireAuth();
  await prisma.emailTemplate.deleteMany({ where: { id, userId } });
  revalidatePath("/templates");
  revalidateTag("templates", "hours");
}
