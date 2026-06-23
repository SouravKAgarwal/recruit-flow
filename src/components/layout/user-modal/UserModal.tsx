import React, { useState } from "react";
import {
  Settings,
  Shield,
  MonitorSmartphone,
  X,
  Bell,
  Palette,
  Database,
  User,
} from "lucide-react";
import { GeneralTab } from "./tabs/GeneralTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { DataTab } from "./tabs/DataTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { AccountTab } from "./tabs/AccountTab";
import { Tab, UserStats, Session, ConnectedAccount } from "./types";

export function UserModal({
  open,
  onClose,
  user,
  userStats,
  activeSessions,
  connectedAccounts,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; email: string; avatar?: string };
  userStats: UserStats | null;
  activeSessions: Session[];
  connectedAccounts: ConnectedAccount[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  if (!open) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "general",
      label: "General",
      icon: <Settings size={16} strokeWidth={1.8} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={16} strokeWidth={1.8} />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette size={16} strokeWidth={1.8} />,
    },
    {
      id: "data",
      label: "Data controls",
      icon: <Database size={16} strokeWidth={1.8} />,
    },
    {
      id: "security",
      label: "Security & login",
      icon: <Shield size={16} strokeWidth={1.8} />,
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: <MonitorSmartphone size={16} strokeWidth={1.8} />,
    },
    {
      id: "account",
      label: "Account",
      icon: <User size={16} strokeWidth={1.8} />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="flex overflow-hidden rounded-2xl border border-border shadow-2xl animate-scale-in"
        style={{
          width: 860,
          height: 500,
          maxWidth: "95vw",
          maxHeight: "92vh",
          background: "var(--card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div
          className="flex flex-col shrink-0 overflow-y-auto border-r border-border"
          style={{
            width: 240,
            background: "var(--background)",
            padding: "10px 8px",
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg mb-3 w-[34px] h-[34px] border-none bg-transparent cursor-pointer text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>

          <nav className="flex flex-col gap-0.5">
            {tabs.map(({ id, label, icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 w-full text-left rounded-lg text-[13px] px-3 py-2.5 border-none cursor-pointer transition-colors ${active ? "bg-muted text-foreground font-semibold" : "bg-transparent text-muted-foreground font-normal hover:bg-muted hover:text-foreground"}`}
                >
                  <span
                    className={`shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {icon}
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
          <div className="px-7 pt-[22px] pb-4 border-b border-border shrink-0">
            <h2 className="text-[17px] font-semibold text-foreground m-0">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "general" && <GeneralTab user={user} onClose={onClose} />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "appearance" && <AppearanceTab />}
            {activeTab === "data" && <DataTab />}
            {activeTab === "security" && <SecurityTab connectedAccounts={connectedAccounts} />}
            {activeTab === "sessions" && <SessionsTab sessions={activeSessions} />}
            {activeTab === "account" && <AccountTab userStats={userStats} user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
}
