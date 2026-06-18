import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "SENDING" && job.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot cancel job in ${job.status} state` },
        { status: 400 },
      );
    }

    // Mark as CANCELLED. The background sending loop reads this and breaks.
    await prisma.job.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await prisma.log.create({
      data: {
        jobId: id,
        level: "WARNING",
        message: "Cancellation requested by user. Halting sending loop...",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign cancellation requested.",
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json(
      { error: error.message || "Failed to cancel campaign" },
      { status: 500 },
    );
  }
}
