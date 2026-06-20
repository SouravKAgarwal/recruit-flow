"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CampaignRefresher({
  hasRunningCampaigns,
}: {
  hasRunningCampaigns: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!hasRunningCampaigns) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [hasRunningCampaigns, router]);

  return null;
}
