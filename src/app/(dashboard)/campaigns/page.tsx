import { getSmtpAccounts } from "@/app/actions/smtp";
import { getTemplates } from "@/app/actions/templates";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const NewCampaignModal = dynamic(() =>
  import("@/components/campaigns/NewCampaignModal").then(
    (mod) => mod.NewCampaignModal,
  ),
);

export const metadata = { title: "Campaigns" };

async function CampaignModal() {
  const [smtpAccounts, templates] = await Promise.all([
    getSmtpAccounts(),
    getTemplates(),
  ]);

  return <NewCampaignModal smtpAccounts={smtpAccounts} templates={templates} />;
}

export default function CampaignsPage() {
  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-5">
        <Suspense fallback={<ActionBarSkeleton />}>
          <CampaignModal />
        </Suspense>
      </div>

      <CampaignsTable />
    </div>
  );
}

function ActionBarSkeleton() {
  return <Skeleton className="h-8 w-30 rounded-md" />;
}
