import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runCampaign } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(jobs);
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientsFilename, resumeFilename, templateText, smtp } = body;

    if (!recipientsFilename || !templateText || !smtp) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const { server, port, email, password } = smtp;
    if (!server || !port || !email || !password) {
      return NextResponse.json(
        { error: "Missing SMTP parameters" },
        { status: 400 },
      );
    }

    // 1. Create a Pending Job record in the database
    const job = await prisma.job.create({
      data: {
        status: "PENDING",
        recipientsFilename,
        resumeFilename: resumeFilename || "",
        templateText,
      },
    });

    // 2. Start campaign execution asynchronously in the background.
    // The API immediately returns, allowing the client to poll or monitor logs.
    runCampaign(job.id, {
      server,
      port: parseInt(port),
      email,
      password,
    }).catch((err) => {
      console.error(`Background campaign execution for ${job.id} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Campaign started successfully.",
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 },
    );
  }
}
