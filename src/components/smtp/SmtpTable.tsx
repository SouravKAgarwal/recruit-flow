import { Server } from "lucide-react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { SmtpRowActions } from "./SmtpRowActions";

interface SmtpAccount {
  id: string;
  label: string;
  senderName: string;
  email: string;
  host: string;
  port: number;
  username: string;
  tls: boolean;
  isDefault: boolean;
  emailsSent: number;
  lastUsedAt: Date | null;
}

interface SmtpTableProps {
  accounts: SmtpAccount[];
}

export function SmtpTable({ accounts }: SmtpTableProps) {
  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <SortableHeader sortKey="label">Account</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="host">Host</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="emailsSent">Sent</SortableHeader>
            </th>
            <th style={{ textAlign: "right" }}>Status / Action</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "var(--color-text-muted)",
                }}
              >
                <div className="flex flex-col items-center">
                  <Server size={40} className="opacity-30 mb-4" />
                  <p
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      color: "var(--color-text)",
                    }}
                  >
                    No SMTP accounts found
                  </p>
                  <p className="text-sm">
                    Add your first email account to start sending campaigns
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            accounts.map((acc) => (
              <tr key={acc.id}>
                <td>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--color-text)",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {acc.label}
                      {acc.isDefault && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--color-primary-muted)",
                            color: "var(--color-primary)",
                            padding: "2px 6px",
                            fontSize: 10,
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-dim)",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {acc.email}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div style={{ color: "var(--color-text)", fontSize: 13 }}>
                      {acc.host}:{acc.port}
                    </div>
                    {acc.tls && (
                      <div
                        style={{
                          color: "var(--color-success)",
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        🔒 TLS
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div
                    style={{ color: "var(--color-text-muted)", fontSize: 13 }}
                  >
                    {acc.emailsSent}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <SmtpRowActions account={acc} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
