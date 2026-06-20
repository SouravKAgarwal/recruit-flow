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
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Email History" };

const STATUS_META: Record<string, { color: string; icon: React.ReactNode }> = {
  SENT: { color: "var(--color-success)", icon: <CheckCircle size={13} /> },
  OPENED: { color: "var(--color-primary)", icon: <Mail size={13} /> },
  REPLIED: { color: "#a78bfa", icon: <Mail size={13} /> },
  FAILED: { color: "var(--color-danger)", icon: <XCircle size={13} /> },
  QUEUED: { color: "var(--color-text-muted)", icon: <Clock size={13} /> },
};

async function HistoryList() {
  const logs = await getEmailHistory();

  return (
    <div>
      {logs.length === 0 && (
        <div className="glass p-12 text-center">
          <Mail size={40} className="text-text-dim mx-auto mb-4" />
          <p className="font-semibold mb-2">No emails sent yet</p>
          <p className="text-[var(--color-text-muted)] text-[13.5px]">
            Send your first campaign to see history here
          </p>
        </div>
      )}

      <div className="flex flex-col">
        {logs.map((log, idx) => {
          const meta = STATUS_META[log.status] ?? STATUS_META.SENT;
          return (
            <div key={log.id} className="flex gap-4 relative">
              {/* Timeline line */}
              {idx < logs.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-[var(--color-border)]" />
              )}

              {/* Status dot */}
              <div className="shrink-0 w-10 flex flex-col items-center pt-[14px]">
                <div
                  className="w-7 h-7 rounded-full border flex items-center justify-center"
                  style={{
                    background: `${meta.color}18`,
                    borderColor: `${meta.color}40`,
                    color: meta.color,
                  }}
                >
                  {meta.icon}
                </div>
              </div>

              {/* Content */}
              <div className="glass flex-1 px-[18px] py-[14px] mb-2.5 mt-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-[var(--color-text)]">
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
                      <p className="text-[13px] text-[var(--color-text-muted)] mb-1">
                        <strong className="text-[var(--color-text-dim)]">
                          Subject:
                        </strong>{" "}
                        {log.subject}
                      </p>
                    )}
                    <div className="flex gap-[14px] text-xs text-[var(--color-text-dim)] flex-wrap">
                      {log.recruiter && (
                        <span className="flex items-center gap-1">
                          <Building2 size={11} /> {log.recruiter.company}
                        </span>
                      )}
                      {log.template && (
                        <span className="flex items-center gap-1">
                          <FileText size={11} /> {log.template.name}
                        </span>
                      )}
                      {log.smtpAccount && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {log.smtpAccount.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDistanceToNow(new Date(log.sentAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
                      {format(new Date(log.sentAt), "MMM d, h:mm a")}
                    </p>
                    {log.openedAt && (
                      <p className="text-[11px] text-[var(--color-success)] mt-0.5">
                        ✓ Opened
                      </p>
                    )}
                    {log.repliedAt && (
                      <p className="text-[11px] text-[#a78bfa] mt-0.5">
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

function HistorySkeleton() {
  return (
    <div className="flex flex-col">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="flex gap-4 relative">
          {idx < 3 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-[var(--color-border)]" />
          )}

          <div className="shrink-0 w-10 flex flex-col items-center pt-[14px]">
            <Skeleton className="w-7 h-7 rounded-full" />
          </div>

          <div className="glass flex-1 px-[18px] py-[14px] mb-2.5 mt-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-[14px] mt-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-5"></div>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryList />
      </Suspense>
    </div>
  );
}
