"use server";

import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Resume } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

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

  const ext = file.name.split(".").pop() ?? "pdf";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "recruits-flow/resumes",
            public_id: filename,
            resource_type: "raw",
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { error: "Failed to upload resume to Cloudinary." };
  }

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
    await cloudinary.uploader.destroy(
      `recruits-flow/resumes/${resume.filename}`,
      { resource_type: "raw" },
    );
  } catch (e) {
    console.error("Failed to delete from Cloudinary", e);
  }

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

  try {
    let fileBuffer: Buffer;

    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/recruits-flow/resumes/${filename}`;
    const response = await fetch(cloudinaryUrl);
    if (!response.ok) throw new Error("File not found on Cloudinary");
    fileBuffer = Buffer.from(await response.arrayBuffer());

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
