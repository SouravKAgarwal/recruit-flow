import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch job details" },
      { status: 500 },
    );
  }
}
