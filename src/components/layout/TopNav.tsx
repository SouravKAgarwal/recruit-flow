"use client";

import { Bell, Search, LogOut, User } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  userName: string;
  userEmail: string;
}

export function TopNav({ userName, userEmail }: TopNavProps) {
  const [pending, startTransition] = useTransition();

  return (
    <header style={{
      height: 56,
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      background: "rgba(9,9,11,0.7)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      {/* Search trigger */}
      <Button
        variant="outline"
        onClick={() => {
          const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
          window.dispatchEvent(event);
        }}
        className="flex items-center gap-2 bg-muted border-border text-muted-foreground text-[13px] h-8 px-3"
      >
        <Search size={14} />
        <span className="font-normal hidden sm:inline">Search commands…</span>
        <kbd className="ml-4 text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </Button>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="icon" title="Notifications" className="h-8 w-8 text-muted-foreground">
          <Bell size={16} />
        </Button>

        {/* User menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 4 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <User size={15} color="#fff" />
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{userName}</p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{userEmail}</p>
          </div>
          <form
            action={async () => {
              startTransition(async () => {
                await logout();
              });
            }}
          >
            <Button
              type="submit"
              disabled={pending}
              variant="ghost"
              size="icon"
              title="Sign out"
              className="h-8 w-8 text-muted-foreground"
            >
              <LogOut size={15} />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
