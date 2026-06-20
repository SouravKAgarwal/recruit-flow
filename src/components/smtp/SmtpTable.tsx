import { Server } from "lucide-react";
import { SmtpRowActions } from "./SmtpRowActions";
import { getSmtpAccounts } from "@/app/actions/smtp";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function DynamicSmtpTable() {
  const accounts = await getSmtpAccounts();

  return (
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
              <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
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
  );
}

function TableSkeleton() {
  return (
    <tbody>
      {[...Array(3)].map((_, i) => (
        <tr key={i}>
          <td>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
          </td>
          <td>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </td>
          <td>
            <Skeleton className="h-4 w-12" />
          </td>
          <td className="text-right">
            <Skeleton className="h-8 w-8 ml-auto rounded-md" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function SmtpTable() {
  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Host</th>
            <th>Sent</th>
            <th style={{ textAlign: "right" }}>Status / Action</th>
          </tr>
        </thead>
        <Suspense fallback={<TableSkeleton />}>
          <DynamicSmtpTable />
        </Suspense>
      </table>
    </div>
  );
}
