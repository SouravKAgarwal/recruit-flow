"use server";

import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Resume } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

export async function getResumes(): Promise<Resume[]> {
  const { userId } = await requireAuth();
  return getCachedResumes(userId);
}

async function getCachedResumes(userId: string): Promise<Resume[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("resumes", userId);

  return prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadResume(formData: FormData) {
  await enforceRateLimit("upload_resume");
  const { userId } = await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };

  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(file.type)) {
    return { error: "Only PDF and DOCX files are supported." };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop() ?? "pdf";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  await prisma.resume.create({
    data: {
      userId,
      filename,
      originalName: file.name,
      size: buffer.length,
      isActive: false,
    },
  });

  revalidatePath("/resumes");
  revalidateTag("resumes", "seconds");
  return { success: true };
}

export async function setActiveResume(id: string) {
  await enforceRateLimit("set_active_resume");
  const { userId } = await requireAuth();
  await prisma.resume.updateMany({
    where: { userId },
    data: { isActive: false },
  });
  await prisma.resume.update({ where: { id }, data: { isActive: true } });
  revalidatePath("/resumes");
  revalidateTag("resumes", "seconds");
}

export async function deleteResume(id: string) {
  await enforceRateLimit("delete_resume");
  const { userId } = await requireAuth();
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) return;

  try {
    await fs.unlink(path.join(UPLOAD_DIR, resume.filename));
  } catch {}

  await prisma.resume.delete({ where: { id } });
  revalidatePath("/resumes");
  revalidateTag("resumes", "seconds");
}

export async function downloadResumeAction(filename: string) {
  await enforceRateLimit("download_resume");
  const { userId } = await requireAuth();

  const resume = await prisma.resume.findFirst({
    where: { filename, userId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  const filePath = path.join(process.cwd(), "uploads", "resumes", filename);
  try {
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString("base64");
    return {
      success: true,
      filename: resume.originalName,
      base64Data,
      mimeType: "application/pdf",
    };
  } catch {
    throw new Error("File not found");
  }
}
