import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const session = await requireAuth().catch(() => null);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { filename } = await params;

    const resume = await prisma.resume.findFirst({
      where: { filename, userId: session.userId },
    });

    if (!resume) {
      return new NextResponse("Not Found", { status: 404 });
    }

    let fileBuffer: Buffer;
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/recruits-flow/resumes/${filename}`;
    const response = await fetch(cloudinaryUrl);
    if (!response.ok)
      return new NextResponse("Not Found on Cloudinary", { status: 404 });
    fileBuffer = Buffer.from(await response.arrayBuffer());

    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new NextResponse(fileBuffer as any, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${resume.originalName}"`,
      },
    });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
