"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Send, Mail,
  Settings, History, Kanban, ChevronLeft, ChevronRight, Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard, shortcut: "1" },
  { href: "/recruiters", label: "Recruiters",   icon: Users,           shortcut: "2" },
  { href: "/templates",  label: "Templates",    icon: FileText,        shortcut: "3" },
  { href: "/campaigns",  label: "Campaigns",    icon: Send,            shortcut: "4" },
  { href: "/resumes",    label: "Resumes",      icon: Mail,            shortcut: "5" },
  { href: "/history",    label: "History",      icon: History,         shortcut: "6" },
  { href: "/crm",        label: "CRM Pipeline", icon: Kanban,          shortcut: "7" },
  { href: "/smtp",       label: "SMTP",         icon: Settings,        shortcut: "8" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        minHeight: "100dvh",
        background: "rgba(17,24,39,0.8)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "16px 8px" : "16px 12px",
        flexShrink: 0,
        transition: "width 200ms ease",
        position: "sticky",
        top: 0,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "4px 4px 20px",
        overflow: "hidden",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={16} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)", whiteSpace: "nowrap" }}>
              RecruitFlow
            </p>
            <p style={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              AI
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map(({ href, label, icon: Icon, shortcut }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${active ? "active" : ""}`}
              title={collapsed ? label : undefined}
              style={{ justifyContent: collapsed ? "center" : undefined, padding: collapsed ? "8px" : undefined }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{label}</span>
                  <kbd style={{
                    fontSize: 10, color: "var(--color-text-dim)",
                    background: "var(--color-muted)", borderRadius: 4,
                    padding: "1px 5px", border: "1px solid var(--color-border)",
                    fontFamily: "var(--font-mono)",
                  }}>{shortcut}</kbd>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          marginTop: 8, justifyContent: "center", padding: "7px",
          color: "var(--color-text-muted)", fontSize: 12,
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={15} /> : (
          <><ChevronLeft size={15} /><span>Collapse</span></>
        )}
      </Button>
    </aside>
  );
}
