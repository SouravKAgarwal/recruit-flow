"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

export async function getResumes() {
  const { userId } = await requireAuth();
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadResume(formData: FormData) {
  const { userId } = await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };

  const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
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
  return { success: true };
}

export async function setActiveResume(id: string) {
  const { userId } = await requireAuth();
  await prisma.resume.updateMany({ where: { userId }, data: { isActive: false } });
  await prisma.resume.update({ where: { id }, data: { isActive: true } });
  revalidatePath("/resumes");
}

export async function renameResume(id: string, newName: string) {
  const { userId } = await requireAuth();
  await prisma.resume.updateMany({
    where: { id, userId },
    data: { originalName: newName },
  });
  revalidatePath("/resumes");
}

export async function deleteResume(id: string) {
  const { userId } = await requireAuth();
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) return;

  try {
    await fs.unlink(path.join(UPLOAD_DIR, resume.filename));
  } catch {}

  await prisma.resume.delete({ where: { id } });
  revalidatePath("/resumes");
}
