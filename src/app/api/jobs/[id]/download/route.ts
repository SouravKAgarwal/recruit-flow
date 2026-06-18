import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const ext = path.extname(job.recipientsFilename);
    const updatedFilename = `${id}_updated${ext}`;
    const filepath = path.join(
      process.cwd(),
      "uploads",
      "recipients",
      updatedFilename,
    );

    try {
      await fs.access(filepath);
    } catch {
      return NextResponse.json(
        { error: "Updated spreadsheet file not found" },
        { status: 404 },
      );
    }

    const fileBuffer = await fs.readFile(filepath);

    // Return the file buffer with headers to trigger downloading
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="recipients_updated_${id}${ext}"`,
      },
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json(
      { error: error.message || "Download failed" },
      { status: 500 },
    );
  }
}
