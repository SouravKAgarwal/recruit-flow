import { formatDistanceToNow } from "date-fns";
import { CampaignRowActions } from "./CampaignRowActions";
import {
  Mail,
  FileText,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getCampaigns } from "@/app/actions/campaigns";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Campaign = {
  id: string;
  name: string;
  status: string;
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  createdAt: Date;
  smtpAccount: { label: string; email: string } | null;
  template: { name: string } | null;
};

import { CampaignRefresher } from "./CampaignRefresher";

async function DynamicCampaignData() {
  const campaigns: Campaign[] = await getCampaigns();
  const hasRunningCampaigns = campaigns.some((c) => c.status === "RUNNING");

  return (
    <tbody>
      <CampaignRefresher hasRunningCampaigns={hasRunningCampaigns} />
      {campaigns.length === 0 && (
        <tr>
          <td colSpan={5} className="text-center p-12 text-muted">
            No campaigns found.
          </td>
        </tr>
      )}
      {campaigns.map((c) => {
        const meta = STATUS_META[c.status] ?? STATUS_META.DRAFT;
        return (
          <tr key={c.id}>
            <td>
              <div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-text-dim text-xs mt-1">
                  Started{" "}
                  {formatDistanceToNow(new Date(c.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </td>
            <td>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase">
                {meta.icon} {meta.label}
              </span>
            </td>
            <td>
              <div className="flex flex-col gap-1">
                {c.smtpAccount && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} /> {c.smtpAccount.label}
                  </span>
                )}
                {c.template && (
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} /> {c.template.name}
                  </span>
                )}
              </div>
            </td>
            <td>
              {c.totalEmails === 0 ? (
                <span style={{ color: "var(--color-text-dim)" }}>—</span>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Sent
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {c.sentEmails}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Failed
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {c.failedEmails}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Total
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {c.totalEmails}
                    </div>
                  </div>
                </div>
              )}
            </td>
            <td>
              <CampaignRowActions id={c.id} status={c.status} />
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "var(--color-text-dim)",
    bg: "var(--color-muted)",
    icon: <Clock size={12} />,
  },
  RUNNING: {
    label: "Running",
    color: "var(--color-warning)",
    bg: "var(--color-warning-muted)",
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  COMPLETED: {
    label: "Completed",
    color: "var(--color-success)",
    bg: "var(--color-success-muted)",
    icon: <CheckCircle size={12} />,
  },
  FAILED: {
    label: "Failed",
    color: "var(--color-danger)",
    bg: "var(--color-danger-muted)",
    icon: <XCircle size={12} />,
  },
};

export function CampaignsTable() {
  return (
    <div className="glass overflow-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Status</th>
            <th>Account & Template</th>
            <th>Metrics</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>

        <Suspense fallback={<TableSkeleton />}>
          <DynamicCampaignData />
        </Suspense>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <tbody>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          <td>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </td>
          <td>
            <Skeleton className="h-5 w-20 rounded-md" />
          </td>
          <td>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </td>
          <td>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
          </td>
          <td className="text-right">
            <Skeleton className="h-8 w-8 ml-auto rounded-md" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}
