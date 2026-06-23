import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/Toast";
import { authClient } from "@/lib/auth-client";
import { deleteAccount } from "@/app/actions/auth";
import { Row, SectionHeader } from "../primitives";
import { UserStats } from "../types";

export function AccountTab({ userStats, user }: { userStats: UserStats | null, user: { name: string; email: string; avatar?: string } }) {
  const { toast } = useToast();
  
  const { data: currentSessionData } = authClient.useSession();

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you absolutely sure? This permanently deletes your account and all data.",
      )
    )
      return;
    try {
      await deleteAccount();
      await authClient.signOut();
      window.location.href = "/login";
    } catch {
      toast("error", "Error", "Failed to delete account.");
    }
  };

  return (
    <div>
      <Row label="Emails sent this month" hint="Across all campaigns">
        {!userStats ? (
          <Skeleton className="h-4 w-8" />
        ) : (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {userStats?.emailsSentThisMonth ?? "—"}
          </span>
        )}
      </Row>

      <SectionHeader>Info</SectionHeader>
      <Row label="Member since">
        {!userStats ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span className="text-sm text-muted-foreground">
            {userStats?.createdAt
              ? new Date(userStats.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </span>
        )}
      </Row>
      <Row label="Email verified">
        {!userStats ? (
          <Skeleton className="h-5 w-16 rounded-full" />
        ) : (
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={
              userStats?.emailVerified
                ? {
                    background: "rgba(16,163,127,0.12)",
                    color: "#10a37f",
                  }
                : {
                    background: "rgba(239,68,68,0.1)",
                    color: "var(--destructive)",
                  }
            }
          >
            {userStats?.emailVerified ? "Verified" : "Not verified"}
          </span>
        )}
      </Row>
      <Row label="User ID">
        {!currentSessionData ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-xs text-muted-foreground font-mono">
            {currentSessionData?.user?.id?.slice(0, 20) ?? "—"}
          </span>
        )}
      </Row>

      <SectionHeader>Danger zone</SectionHeader>
      <div className="px-7 py-5">
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="text-sm font-medium text-destructive bg-transparent border border-destructive/30 hover:bg-destructive/10 rounded-lg px-5 py-2 cursor-pointer transition-colors"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
