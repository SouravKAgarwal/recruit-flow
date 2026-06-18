import { formatDistanceToNow } from "date-fns";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { CampaignRowActions } from "./CampaignRowActions";
import { Mail, FileText, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

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

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <SortableHeader sortKey="name">Campaign</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="status">Status</SortableHeader>
            </th>
            <th>Account & Template</th>
            <th>Metrics</th>
            <th style={{ textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "var(--color-text-muted)",
                }}
              >
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
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--color-text)",
                        fontSize: 14,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-dim)",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Started{" "}
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {c.smtpAccount && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} /> {c.smtpAccount.label}
                      </span>
                    )}
                    {c.template && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
      </table>
    </div>
  );
}
