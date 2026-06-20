"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function getRecruiters() {
  const { userId } = await requireAuth();
  return prisma.recruiter.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRecruiter(
  id: string,
  data: Partial<{
    name: string;
    company: string;
    role: string;
    email: string;
    linkedin: string;
    location: string;
    status: string;
    crmStage: string;
    tags: string;
    notes: string;
  }>,
) {
  await enforceRateLimit("update_recruiter");
  const { userId } = await requireAuth();
  await prisma.recruiter.updateMany({ where: { id, userId }, data });
  revalidatePath("/recruiters");
  revalidatePath("/crm");
}

export async function deleteRecruiter(id: string) {
  await enforceRateLimit("delete_recruiter");
  const { userId } = await requireAuth();
  await prisma.recruiter.deleteMany({ where: { id, userId } });
  revalidatePath("/recruiters");
}

export async function bulkDeleteRecruiters(ids: string[]) {
  await enforceRateLimit("bulk_delete_recruiters");
  const { userId } = await requireAuth();
  await prisma.recruiter.deleteMany({ where: { id: { in: ids }, userId } });
  revalidatePath("/recruiters");
}

export async function importRecruiters(
  rows: Array<{
    name?: string;
    company?: string;
    role?: string;
    email?: string;
    linkedin?: string;
    location?: string;
  }>,
) {
  await enforceRateLimit("import_recruiters");
  const { userId } = await requireAuth();
  if (!rows.length) return { count: 0 };

  // Deduplicate by email vs existing
  const existingEmails = new Set(
    (
      await prisma.recruiter.findMany({
        where: { userId },
        select: { email: true },
      })
    ).map((r: { email: string }) => r.email.toLowerCase()),
  );

  const toInsert = rows.filter(
    (r) => r.email && !existingEmails.has((r.email ?? "").toLowerCase()),
  );

  await prisma.recruiter.createMany({
    data: toInsert.map((r) => ({ userId, ...r })),
  });

  revalidatePath("/recruiters");
  return { count: toInsert.length, skipped: rows.length - toInsert.length };
}

export async function updateCrmStage(id: string, crmStage: string) {
  await enforceRateLimit("update_crm_stage");
  const { userId } = await requireAuth();
  await prisma.recruiter.updateMany({
    where: { id, userId },
    data: { crmStage },
  });
  revalidatePath("/crm");
}
