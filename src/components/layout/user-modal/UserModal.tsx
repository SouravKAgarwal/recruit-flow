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
        className="flex flex-col md:flex-row overflow-hidden md:rounded-2xl border-0 md:border md:border-border shadow-2xl animate-scale-in w-full h-[100dvh] md:h-[500px] md:max-h-[92vh] md:max-w-[860px]"
        style={{
          background: "var(--card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div
          className="flex md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto border-b md:border-b-0 md:border-r border-border w-full md:w-[240px] items-center md:items-stretch bg-background/50 md:bg-background p-2 md:p-[10px_8px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            onClick={onClose}
            className="hidden md:flex items-center justify-center rounded-lg mb-3 w-[34px] h-[34px] border-none bg-transparent cursor-pointer text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>

          <nav className="flex flex-row md:flex-col gap-1 md:gap-0.5 w-full">
            {tabs.map(({ id, label, icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center justify-center md:justify-start gap-1.5 whitespace-nowrap text-left rounded-lg text-[13px] px-3 py-2.5 border-none cursor-pointer transition-colors ${active ? "bg-muted text-foreground font-semibold" : "bg-transparent text-muted-foreground font-normal hover:bg-muted hover:text-foreground"}`}
                >
                  <span
                    className={`shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {icon}
                  </span>
                  <span className="hidden md:inline">{label}</span>
                  <span className="md:hidden text-xs">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
          <div className="flex items-center justify-between px-7 pt-4 md:pt-[22px] pb-4 border-b border-border shrink-0">
            <h2 className="text-[17px] font-semibold text-foreground m-0">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <button
              onClick={onClose}
              className="md:hidden flex items-center justify-center rounded-lg w-[34px] h-[34px] border-none bg-transparent cursor-pointer text-muted-foreground hover:bg-muted transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </button>
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
