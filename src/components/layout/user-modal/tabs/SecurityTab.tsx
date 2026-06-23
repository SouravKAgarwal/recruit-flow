import React, { useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/Toast";
import { updatePassword } from "@/app/actions/auth";
import { Row, SectionHeader } from "../primitives";
import { GoogleIcon, GitHubIcon } from "../icons";
import { ConnectedAccount } from "../types";

export function SecurityTab({ connectedAccounts }: { connectedAccounts: ConnectedAccount[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await updatePassword(undefined, fd);
      if (res?.error) {
        toast("error", "Error", res.error);
      } else if (res?.errors) {
        const f = Object.values(res.errors)[0]?.[0];
        if (f) toast("error", "Error", f);
      } else {
        toast(
          "success",
          "Password changed",
          "Your password has been updated and other sessions have been signed out.",
        );
        form.reset();
      }
    });
  };

  const PROVIDERS: {
    id: string;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "google",
      label: "Google",
      icon: <GoogleIcon size={16} />,
    },
    {
      id: "github",
      label: "GitHub",
      icon: <GitHubIcon size={16} />,
    },
    {
      id: "credential",
      label: "Email / Password",
      icon: <Mail size={16} className="text-muted-foreground" />,
    },
  ];

  return (
    <form id="security-form" onSubmit={handlePasswordSubmit}>
      <SectionHeader>Change password</SectionHeader>
      <Row label="Current password" hint="Required to change your password">
        <input
          name="currentPassword"
          type="password"
          placeholder="••••••••"
          required
          className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-48 font-[inherit]"
        />
      </Row>
      <Row label="New password" hint="Min 12 characters">
        <input
          name="newPassword"
          type="password"
          placeholder="••••••••"
          required
          minLength={12}
          className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-48 font-[inherit]"
        />
      </Row>
      <div className="px-7 py-3 flex justify-end">
        <button
          type="submit"
          form="security-form"
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 cursor-pointer transition-opacity border border-border bg-muted text-foreground disabled:opacity-70"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Update password
        </button>
      </div>

      <SectionHeader>Connected accounts</SectionHeader>
      {PROVIDERS.map((p) => {
        const connected = connectedAccounts?.find((a) => a.providerId === p.id);
        
        return (
          <div
            key={p.id}
            className="flex items-center justify-between px-7 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                {p.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground">{p.label}</span>
                {!connectedAccounts ? (
                  <Skeleton className="h-3 w-24 mt-0.5" />
                ) : connected ? (
                  <span className="text-xs text-muted-foreground">
                    Connected{" "}
                    {new Date(connected.connectedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>
            {!connectedAccounts ? (
              <Skeleton className="h-5 w-20 rounded-full" />
            ) : (
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={
                  connected
                    ? {
                        background: "rgba(16,163,127,0.12)",
                        color: "#10a37f",
                      }
                    : {
                        background: "var(--muted)",
                        color: "var(--muted-foreground)",
                      }
                }
              >
                {connected ? "Connected" : "Not connected"}
              </span>
            )}
          </div>
        );
      })}
    </form>
  );
}
