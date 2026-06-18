"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CampaignAutoRefresh({ hasRunning }: { hasRunning: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hasRunning) return;

    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [hasRunning, router]);

  return null;
}
