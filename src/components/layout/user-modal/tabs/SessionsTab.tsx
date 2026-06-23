import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/Toast";
import { authClient } from "@/lib/auth-client";
import { revokeSession } from "@/app/actions/auth";
import { DeviceIcon, parseBrowser, parseOS, parseDeviceType } from "../icons";
import { Session } from "../types";

export function SessionsTab({
  sessions: initialSessions,
}: {
  sessions: Session[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);

  const { data: currentSessionData } = authClient.useSession();
  const currentSessionToken = currentSessionData?.session?.token;

  const handleRevokeSession = (token: string) => {
    setRevokingToken(token);
    startTransition(async () => {
      try {
        await revokeSession(token);
        setSessions((p) => p.filter((s) => s.token !== token));
        toast("success", "Revoked", "Session terminated.");
        if (token === currentSessionToken) window.location.href = "/login";
      } catch {
        toast("error", "Error", "Failed to revoke session.");
      } finally {
        setRevokingToken(null);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between px-7 py-3">
        <span className="text-xs text-muted-foreground">
          Devices currently logged in to your account
        </span>
      </div>

      {!sessions ? (
        <div className="flex flex-col">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-7 py-3.5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </div>
      ) : sessions?.length === 0 ? (
        <p className="text-sm text-muted-foreground px-7 py-6">
          No active sessions found.
        </p>
      ) : (
        sessions?.map((s, i) => {
          const isCurrent = s.token === currentSessionToken;
          const browser = parseBrowser(s.userAgent);
          const os = parseOS(s.userAgent);
          const deviceType = parseDeviceType(s.userAgent);
          const deviceLabel =
            deviceType === "mobile"
              ? "Mobile"
              : deviceType === "tablet"
                ? "Tablet"
                : "Desktop";
          const lastActive = s.updatedAt
            ? formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })
            : "Unknown";

          const isRevokingThis = revokingToken === s.token;

          return (
            <div
              key={s.token || s.id || i}
              className="group flex items-center justify-between px-7 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-lg w-10 h-10 bg-muted shrink-0">
                  <DeviceIcon ua={s.userAgent} size={18} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {browser}
                      {os ? ` · ${os}` : ""}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {deviceLabel}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(16,163,127,0.15)",
                          color: "#10a37f",
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {s.ipAddress || "Unknown IP"} · {lastActive}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRevokeSession(s.token!)}
                disabled={isRevokingThis || isPending}
                className="flex items-center gap-1.5 text-[11px] font-medium opacity-100 transition-opacity rounded-md px-2 py-1 border-none cursor-pointer hover:bg-muted disabled:opacity-50"
                style={{
                  color: isCurrent
                    ? "var(--muted-foreground)"
                    : "var(--destructive)",
                  background: "none",
                }}
              >
                {isRevokingThis ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Revoking…
                  </>
                ) : isCurrent ? (
                  "Sign out"
                ) : (
                  "Revoke"
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
