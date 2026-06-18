import { getEmailHistory } from "@/app/actions/campaigns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Building2,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export const metadata = { title: "Email History" };

const STATUS_META: Record<string, { color: string; icon: React.ReactNode }> = {
  SENT: { color: "var(--color-success)", icon: <CheckCircle size={13} /> },
  OPENED: { color: "var(--color-primary)", icon: <Mail size={13} /> },
  REPLIED: { color: "#a78bfa", icon: <Mail size={13} /> },
  FAILED: { color: "var(--color-danger)", icon: <XCircle size={13} /> },
  QUEUED: { color: "var(--color-text-muted)", icon: <Clock size={13} /> },
};

export default async function HistoryPage() {
  const logs = await getEmailHistory();

  return (
    <div>
      {logs.length === 0 && (
        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
          <Mail
            size={40}
            style={{ color: "var(--color-text-dim)", margin: "0 auto 16px" }}
          />
          <p style={{ fontWeight: 600, marginBottom: 8 }}>No emails sent yet</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>
            Send your first campaign to see history here
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {logs.map((log, idx) => {
          const meta = STATUS_META[log.status] ?? STATUS_META.SENT;
          return (
            <div
              key={log.id}
              style={{ display: "flex", gap: 16, position: "relative" }}
            >
              {/* Timeline line */}
              {idx < logs.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 19,
                    top: 40,
                    bottom: 0,
                    width: 1,
                    background: "var(--color-border)",
                  }}
                />
              )}

              {/* Status dot */}
              <div
                style={{
                  flexShrink: 0,
                  width: 40,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 14,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `${meta.color}18`,
                    border: `1px solid ${meta.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: meta.color,
                  }}
                >
                  {meta.icon}
                </div>
              </div>

              {/* Content */}
              <div
                className="glass"
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  marginBottom: 10,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "var(--color-text)",
                        }}
                      >
                        {log.toEmail}
                      </p>
                      <span
                        className="badge"
                        style={{
                          color: meta.color,
                          background: `${meta.color}15`,
                        }}
                      >
                        {log.status}
                      </span>
                    </div>
                    {log.subject && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--color-text-muted)",
                          marginBottom: 4,
                        }}
                      >
                        <strong style={{ color: "var(--color-text-dim)" }}>
                          Subject:
                        </strong>{" "}
                        {log.subject}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        fontSize: 12,
                        color: "var(--color-text-dim)",
                        flexWrap: "wrap",
                      }}
                    >
                      {log.recruiter && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Building2 size={11} /> {log.recruiter.company}
                        </span>
                      )}
                      {log.template && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FileText size={11} /> {log.template.name}
                        </span>
                      )}
                      {log.smtpAccount && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Mail size={11} /> {log.smtpAccount.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <p
                      style={{ fontSize: 12, color: "var(--color-text-muted)" }}
                    >
                      {formatDistanceToNow(new Date(log.sentAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-dim)",
                        marginTop: 2,
                      }}
                    >
                      {format(new Date(log.sentAt), "MMM d, h:mm a")}
                    </p>
                    {log.openedAt && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--color-success)",
                          marginTop: 2,
                        }}
                      >
                        ✓ Opened
                      </p>
                    )}
                    {log.repliedAt && (
                      <p
                        style={{ fontSize: 11, color: "#a78bfa", marginTop: 1 }}
                      >
                        ↩ Replied
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
