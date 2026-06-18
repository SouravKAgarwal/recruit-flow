import { getCampaigns } from "@/app/actions/campaigns";
import { getSmtpAccounts } from "@/app/actions/smtp";
import { getTemplates } from "@/app/actions/templates";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { NewCampaignModal } from "@/components/campaigns/NewCampaignModal";
import { CampaignAutoRefresh } from "@/components/campaigns/CampaignAutoRefresh";
import { SearchInput } from "@/components/ui/SearchInput";
import { Zap } from "lucide-react";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  
  const [smtpAccounts, templates] = await Promise.all([
    getSmtpAccounts(),
    getTemplates(),
  ]);
  
  let campaigns = await getCampaigns() as any[];

  // Apply search filtering
  if (q) {
    const query = q.toLowerCase();
    campaigns = campaigns.filter(
      (c) => c.name?.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  if (sort) {
    const [key, direction] = sort.split(":");
    campaigns.sort((a, b) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const hasRunning = campaigns.some((c) => c.status === "RUNNING");

  return (
    <div>
      <CampaignAutoRefresh hasRunning={hasRunning} />



      {/* Quick Setup Banner */}
      {smtpAccounts.length === 0 && (
        <div
          style={{
            background: "var(--color-warning-muted)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            padding: "16px 20px",
            marginBottom: 24,
            borderRadius: "var(--radius-md)",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={18} style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>Action Required: Add an SMTP account</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 2 }}>
              You need an email account to send campaigns.{" "}
              <a href="/smtp" style={{ color: "var(--color-warning)", fontWeight: 500, textDecoration: "underline" }}>
                Configure one here
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex-1">
          <SearchInput placeholder="Search campaigns…" />
        </div>
        <div className="flex sm:w-auto gap-2">
          <NewCampaignModal smtpAccounts={smtpAccounts} templates={templates} />
        </div>
      </div>

      {/* Table */}
      <CampaignsTable campaigns={campaigns} />
    </div>
  );
}
