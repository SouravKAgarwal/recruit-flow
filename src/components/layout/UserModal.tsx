"use client";

import React, { useTransition, useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateUser,
  getActiveSessions,
  revokeSession,
  deleteAccount,
  getConnectedAccounts,
  getUserStats,
} from "@/app/actions/auth";
import { uploadImageAction } from "@/app/actions/upload";
import { useToast } from "@/components/ui/Toast";
import {
  Loader2,
  Settings,
  Shield,
  MonitorSmartphone,
  X,
  Camera,
  Laptop,
  Smartphone,
  Globe,
  Tablet,
  RefreshCw,
  Bell,
  Palette,
  Database,
  User,
  ExternalLink,
  Mail,
  FileText,
  Users,
  BarChart2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { formatDistanceToNow } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab =
  | "general"
  | "notifications"
  | "appearance"
  | "data"
  | "security"
  | "sessions"
  | "account";

interface Session {
  id?: string;
  token?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  expiresAt?: Date | string;
}

// ── Device helpers ────────────────────────────────────────────────────────────

function parseDeviceType(
  ua?: string,
): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!ua) return "unknown";
  const u = ua.toLowerCase();
  if (u.includes("ipad") || (u.includes("android") && !u.includes("mobile")))
    return "tablet";
  if (
    u.includes("mobile") ||
    u.includes("android") ||
    u.includes("iphone") ||
    u.includes("ipod")
  )
    return "mobile";
  return "desktop";
}
function parseBrowser(ua?: string) {
  if (!ua) return "Unknown Browser";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Browser";
}
function parseOS(ua?: string) {
  if (!ua) return "";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "";
}
function DeviceIcon({ ua, size = 18 }: { ua?: string; size?: number }) {
  const t = parseDeviceType(ua);
  if (t === "mobile")
    return <Smartphone size={size} className="text-muted-foreground" />;
  if (t === "tablet")
    return <Tablet size={size} className="text-muted-foreground" />;
  if (t === "desktop")
    return <Laptop size={size} className="text-muted-foreground" />;
  return <Globe size={size} className="text-muted-foreground" />;
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-foreground"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-7 py-3 border-b border-border">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-7 pt-5 pb-1.5 border-b border-border">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative rounded-full transition-colors duration-200 shrink-0 focus:outline-none"
      style={{
        width: 42,
        height: 24,
        background: checked ? "#10a37f" : "var(--muted)",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span
        className="absolute rounded-full transition-transform duration-200"
        style={{
          width: 18,
          height: 18,
          background: "white",
          top: 3,
          left: 3,
          transform: checked ? "translateX(18px)" : "translateX(0)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function ThemeSegment() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex items-center gap-1 rounded-lg p-0.5 bg-muted">
      {(["light", "dark", "system"] as const).map((v) => {
        const active = mounted && theme === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => setTheme(v)}
            className={`text-sm px-3 py-1 rounded-md transition-all duration-150 border-none cursor-pointer font-medium capitalize ${active ? "bg-background text-foreground shadow-sm" : "bg-transparent text-muted-foreground"}`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

function NavBtn({
  label,
  icon,
  href,
}: {
  label: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-7 py-3 border-b border-border no-underline text-foreground hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <ExternalLink size={13} className="text-muted-foreground opacity-60" />
    </a>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function UserModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; email: string; avatar?: string };
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameValue, setNameValue] = useState(user.name || "");
  const [emailValue, setEmailValue] = useState(user.email || "");
  const [passwordValue, setPasswordValue] = useState("");
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const [notif, setNotif] = useState({
    campaignComplete: true,
    emailFailed: true,
    newReply: true,
    weeklyDigest: false,
    productUpdates: false,
  });
  const [dataPrefs, setDataPrefs] = useState({
    analyticsOptIn: true,
    autoDeleteLogs: false,
  });

  // Connected accounts
  type ConnectedAccount = {
    providerId: string;
    accountId: string;
    connectedAt: Date;
  };
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedAccount[]
  >([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  // User stats
  type UserStats = {
    createdAt: Date | null;
    emailVerified: boolean;
    emailsSentThisMonth: number;
    totalRecruiters: number;
    totalCampaigns: number;
    totalTemplates: number;
  };
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const { data: currentSessionData } = authClient.useSession();
  const currentSessionToken = currentSessionData?.session?.token;

  useEffect(() => {
    if (open && activeTab === "sessions" && !sessionsLoaded) loadSessions();
  }, [open, activeTab]);
  useEffect(() => {
    if (open && activeTab === "security" && !accountsLoaded)
      loadConnectedAccounts();
  }, [open, activeTab]);
  useEffect(() => {
    if (open && activeTab === "account" && !statsLoaded) loadUserStats();
  }, [open, activeTab]);
  useEffect(() => {
    if (open) {
      setAvatarPreview(user.avatar || "");
      setNameValue(user.name || "");
      setEmailValue(user.email || "");
    }
  }, [open, user]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const d = await getActiveSessions();
      setSessions(d);
      setSessionsLoaded(true);
    } catch (e) {
      console.error(e);
      toast("error", "Error", "Failed to load sessions.");
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadConnectedAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const d = await getConnectedAccounts();
      setConnectedAccounts(d as ConnectedAccount[]);
      setAccountsLoaded(true);
    } catch (e) {
      console.error(e);
      toast("error", "Error", "Failed to load connected accounts.");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const loadUserStats = async () => {
    setIsLoadingStats(true);
    try {
      const d = await getUserStats();
      setUserStats(d as UserStats);
      setStatsLoaded(true);
    } catch (e) {
      console.error(e);
      toast("error", "Error", "Failed to load account info.");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      await revokeSession(token);
      setSessions((p) => p.filter((s) => s.token !== token));
      toast("success", "Revoked", "Session terminated.");
      if (token === currentSessionToken) window.location.href = "/login";
    } catch {
      toast("error", "Error", "Failed to revoke session.");
    }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.url) {
        setAvatarPreview(res.url);
        await authClient.updateUser({ image: res.url });
        toast("success", "Uploaded", "Avatar updated.");
        window.location.reload();
      } else throw new Error(res.error || "Upload failed");
    } catch (err: any) {
      toast("error", "Upload Failed", err.message);
      setAvatarPreview(user.avatar || "");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateUser(undefined, fd);
      if (res?.error) {
        toast("error", "Error", res.error);
      } else if (res?.errors) {
        const f = Object.values(res.errors)[0]?.[0];
        if (f) toast("error", "Error", f);
      } else {
        if (nameValue) await authClient.updateUser({ name: nameValue });
        toast("success", "Saved", "Profile updated.");
        onClose();
        window.location.reload();
      }
    });
  };

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
            {/* ── GENERAL ── */}
            {activeTab === "general" && (
              <form id="general-form" onSubmit={handleSubmit}>
                {!dismissedBanner && (
                  <div className="relative mx-7 mt-5 mb-1 rounded-xl border border-border bg-muted p-4">
                    <button
                      type="button"
                      onClick={() => setDismissedBanner(true)}
                      className="absolute top-3 right-3 w-[22px] h-[22px] flex items-center justify-center border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center rounded-full w-[30px] h-[30px] bg-border shrink-0">
                        <Shield size={15} className="text-foreground" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        Secure your account
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed m-0">
                      Keep your profile picture and email up to date so you
                      never lose access to your account.
                    </p>
                  </div>
                )}

                <Row label="Profile picture">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() =>
                      !isUploading && fileInputRef.current?.click()
                    }
                    style={{ opacity: isUploading ? 0.7 : 1 }}
                  >
                    <Avatar className="w-9 h-9 border border-border">
                      <AvatarImage
                        src={avatarPreview}
                        alt={user.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted text-foreground text-sm">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploading ? (
                        <Loader2
                          size={12}
                          className="animate-spin text-white"
                        />
                      ) : (
                        <Camera size={12} className="text-white" />
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <input type="hidden" name="avatar" value={avatarPreview} />
                </Row>

                <Row label="Full name">
                  <input
                    name="name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    required
                    className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-48 font-[inherit]"
                  />
                </Row>

                <Row label="Email address">
                  <input
                    name="email"
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    required
                    className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-56 font-[inherit]"
                  />
                </Row>

                <div className="px-7 py-4 flex justify-end">
                  <button
                    type="submit"
                    form="general-form"
                    disabled={isPending || isUploading}
                    className="flex items-center gap-2 text-sm font-semibold rounded-lg px-5 py-2 border-none cursor-pointer transition-opacity"
                    style={{
                      background: "var(--foreground)",
                      color: "var(--background)",
                      opacity: isPending || isUploading ? 0.7 : 1,
                    }}
                  >
                    {(isPending || isUploading) && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Save changes
                  </button>
                </div>
              </form>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div>
                <SectionHeader>Campaign alerts</SectionHeader>
                <Row
                  label="Campaign completed"
                  hint="When a bulk email campaign finishes"
                >
                  <Toggle
                    checked={notif.campaignComplete}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, campaignComplete: v }))
                    }
                  />
                </Row>
                <Row
                  label="Email delivery failed"
                  hint="When an email bounces or fails to send"
                >
                  <Toggle
                    checked={notif.emailFailed}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, emailFailed: v }))
                    }
                  />
                </Row>
                <Row
                  label="Recruiter replied"
                  hint="When a recruiter replies to your outreach"
                >
                  <Toggle
                    checked={notif.newReply}
                    onChange={(v) => setNotif((p) => ({ ...p, newReply: v }))}
                  />
                </Row>
                <SectionHeader>Product</SectionHeader>
                <Row
                  label="Weekly digest"
                  hint="A summary of your activity every Monday"
                >
                  <Toggle
                    checked={notif.weeklyDigest}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, weeklyDigest: v }))
                    }
                  />
                </Row>
                <Row
                  label="Product updates"
                  hint="New features and improvements"
                >
                  <Toggle
                    checked={notif.productUpdates}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, productUpdates: v }))
                    }
                  />
                </Row>
                <div className="px-7 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        "success",
                        "Saved",
                        "Notification preferences updated.",
                      )
                    }
                    className="text-sm font-semibold rounded-lg px-5 py-2 border-none cursor-pointer"
                    style={{
                      background: "var(--foreground)",
                      color: "var(--background)",
                    }}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === "appearance" && (
              <div>
                <Row label="Theme" hint="Choose how RecruitsFlow looks">
                  <ThemeSegment />
                </Row>
                <Row label="Language" hint="Interface language">
                  <span className="text-sm text-muted-foreground">
                    English (US)
                  </span>
                </Row>
                <Row
                  label="Compact mode"
                  hint="Reduce spacing in tables and lists"
                >
                  <Toggle
                    checked={false}
                    onChange={() =>
                      toast(
                        "info",
                        "Coming soon",
                        "Compact mode is not yet available.",
                      )
                    }
                  />
                </Row>
                <Row
                  label="Reduce motion"
                  hint="Disable animations for accessibility"
                >
                  <Toggle
                    checked={false}
                    onChange={() =>
                      toast(
                        "info",
                        "Coming soon",
                        "This preference is coming soon.",
                      )
                    }
                  />
                </Row>
              </div>
            )}

            {/* ── DATA CONTROLS ── */}
            {activeTab === "data" && (
              <div>
                <SectionHeader>Privacy</SectionHeader>
                <Row
                  label="Analytics opt-in"
                  hint="Share anonymous usage data to help us improve"
                >
                  <Toggle
                    checked={dataPrefs.analyticsOptIn}
                    onChange={(v) =>
                      setDataPrefs((p) => ({ ...p, analyticsOptIn: v }))
                    }
                  />
                </Row>
                <Row
                  label="Auto-delete old logs"
                  hint="Purge email logs older than 90 days"
                >
                  <Toggle
                    checked={dataPrefs.autoDeleteLogs}
                    onChange={(v) =>
                      setDataPrefs((p) => ({ ...p, autoDeleteLogs: v }))
                    }
                  />
                </Row>
                <SectionHeader>Export</SectionHeader>
                <NavBtn
                  label="Export recruiters (CSV)"
                  icon={<Users size={15} />}
                  href="/recruiters?export=csv"
                />
                <NavBtn
                  label="Export email history (CSV)"
                  icon={<Mail size={15} />}
                  href="/history?export=csv"
                />
                <NavBtn
                  label="Export campaigns (CSV)"
                  icon={<BarChart2 size={15} />}
                  href="/campaigns?export=csv"
                />
                <SectionHeader>Quick links</SectionHeader>
                <NavBtn
                  label="Manage SMTP accounts"
                  icon={<Mail size={15} />}
                  href="/smtp"
                />
                <NavBtn
                  label="Manage resume files"
                  icon={<FileText size={15} />}
                  href="/resumes"
                />
                <NavBtn
                  label="Manage email templates"
                  icon={<FileText size={15} />}
                  href="/templates"
                />
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <form id="security-form" onSubmit={handleSubmit}>
                <SectionHeader>Password</SectionHeader>
                <Row label="New password" hint="Min 8 characters">
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-48 font-[inherit]"
                  />
                </Row>
                <div className="px-7 py-3 flex justify-end border-b border-border">
                  <button
                    type="submit"
                    form="security-form"
                    disabled={isPending}
                    className="flex items-center gap-2 text-sm font-medium rounded-lg px-5 py-2 cursor-pointer transition-opacity border border-border bg-muted text-foreground"
                    style={{ opacity: isPending ? 0.7 : 1 }}
                  >
                    {isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Update password
                  </button>
                </div>
                <SectionHeader>Connected accounts</SectionHeader>
                {isLoadingAccounts ? (
                  <div className="flex items-center gap-2 px-7 py-4 text-xs text-muted-foreground">
                    <Loader2 size={13} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  (() => {
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
                        icon: (
                          <Mail size={16} className="text-muted-foreground" />
                        ),
                      },
                    ];
                    return PROVIDERS.map((p) => {
                      const connected = connectedAccounts.find(
                        (a) => a.providerId === p.id,
                      );
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-7 py-3 border-b border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                              {p.icon}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-foreground">
                                {p.label}
                              </span>
                              {connected && (
                                <span className="text-xs text-muted-foreground">
                                  Connected{" "}
                                  {new Date(
                                    connected.connectedAt,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
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
                        </div>
                      );
                    });
                  })()
                )}
              </form>
            )}

            {/* ── SESSIONS ── */}
            {activeTab === "sessions" && (
              <div>
                <div className="flex items-center justify-between px-7 py-3">
                  <span className="text-xs text-muted-foreground">
                    Devices currently logged in to your account
                  </span>
                  <button
                    onClick={loadSessions}
                    disabled={isLoadingSessions}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground bg-transparent border-none cursor-pointer rounded-md px-2 py-1 hover:bg-muted transition-colors"
                  >
                    <RefreshCw
                      size={12}
                      className={isLoadingSessions ? "animate-spin" : ""}
                    />
                    {isLoadingSessions ? "Loading…" : "Refresh"}
                  </button>
                </div>

                {!sessionsLoaded && isLoadingSessions ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2
                      size={22}
                      className="animate-spin text-muted-foreground"
                    />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-7 py-6">
                    No active sessions found.
                  </p>
                ) : (
                  sessions.map((s, i) => {
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
                      ? formatDistanceToNow(new Date(s.updatedAt), {
                          addSuffix: true,
                        })
                      : "Unknown";

                    return (
                      <div
                        key={s.token || s.id || i}
                        className={`group flex items-center justify-between px-7 py-3.5 ${i < sessions.length - 1 ? "border-b border-border" : ""}`}
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
                          className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity rounded-md px-2.5 py-1.5 border-none cursor-pointer hover:bg-muted"
                          style={{
                            color: isCurrent
                              ? "var(--muted-foreground)"
                              : "var(--destructive)",
                            background: "none",
                          }}
                        >
                          {isCurrent ? "Sign out" : "Revoke"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── ACCOUNT ── */}
            {activeTab === "account" && (
              <div>
                {isLoadingStats ? (
                  <div className="flex items-center gap-2 px-7 py-4 text-xs text-muted-foreground">
                    <Loader2 size={13} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    <Row
                      label="Emails sent this month"
                      hint="Across all campaigns"
                    >
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {userStats?.emailsSentThisMonth ?? "—"}
                      </span>
                    </Row>

                    <SectionHeader>Info</SectionHeader>
                    <Row label="Member since">
                      <span className="text-sm text-muted-foreground">
                        {userStats?.createdAt
                          ? new Date(userStats.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </span>
                    </Row>
                    <Row label="Email verified">
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
                    </Row>
                    <Row label="User ID">
                      <span className="text-xs text-muted-foreground font-mono">
                        {currentSessionData?.user?.id?.slice(0, 20) ?? "—"}
                      </span>
                    </Row>
                  </>
                )}

                <SectionHeader>Danger zone</SectionHeader>
                <div className="px-7 py-5">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Permanently delete your RecruitsFlow account, including all
                    recruiters, campaigns, email history, templates, and SMTP
                    accounts. <strong>This action cannot be undone.</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer border transition-colors"
                    style={{
                      color: "var(--destructive)",
                      background: "transparent",
                      borderColor:
                        "color-mix(in srgb, var(--destructive) 40%, transparent)",
                    }}
                  >
                    Delete account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
