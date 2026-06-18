import { NextRequest, NextResponse } from "next/server";
import { runModernCampaign } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign ID" },
        { status: 400 },
      );
    }

    // Start campaign execution asynchronously in the background.
    runModernCampaign(campaignId).catch((err) => {
      console.error(`Background campaign execution for ${campaignId} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      message: "Campaign started successfully.",
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error("Run campaign error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run campaign" },
      { status: 500 },
    );
  }
}
