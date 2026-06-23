import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
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

    const filePath = path.join(process.cwd(), "uploads", "resumes", filename);
    const fileBuffer = await fs.readFile(filePath);

    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType = ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${resume.originalName}"`,
      },
    });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
