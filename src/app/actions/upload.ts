"use server";

import { v2 as cloudinary } from "cloudinary";
import { getSession } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageAction(formData: FormData) {
  await enforceRateLimit("upload_image");

  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { error: "No file provided" };
  }

  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === "your_api_key") {
    return { error: "Cloudinary credentials are not configured on the server." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary via stream
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "recruits-flow/avatars",
            public_id: `${session.user.id}-${Date.now()}`,
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as any);
          }
        )
        .end(buffer);
    });

    // Update the database so Better Auth sees the new avatar immediately
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
    });

    return { url: result.secure_url };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { error: error.message || "Failed to upload image" };
  }
}
