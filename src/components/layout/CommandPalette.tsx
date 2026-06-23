"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Mail, FileText, Settings,
  Send, History, Kanban, Search, Zap, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COMMANDS = [
  { id: "dashboard",  label: "Go to Dashboard",       icon: LayoutDashboard, href: "/" },
  { id: "recruiters", label: "Go to Recruiters",       icon: Users,           href: "/recruiters" },
  { id: "templates",  label: "Go to Templates",        icon: FileText,        href: "/templates" },
  { id: "campaigns",  label: "Go to Campaigns",        icon: Send,            href: "/campaigns" },
  { id: "smtp",       label: "Go to SMTP Accounts",    icon: Settings,        href: "/smtp" },
  { id: "resumes",    label: "Go to Resumes",          icon: Mail,            href: "/resumes" },
  { id: "history",    label: "Go to Email History",    icon: History,         href: "/history" },
  { id: "crm",        label: "Go to CRM Pipeline",     icon: Kanban,          href: "/crm" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered[activeIdx]) {
      router.push(filtered[activeIdx].href);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div className="command-box" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--color-border)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands…"
            className="flex-1 bg-transparent border-none outline-none shadow-none focus-visible:ring-0 text-[15px]"
          />
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-6 w-6 text-muted-foreground p-0">
            <X size={16} />
          </Button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 340, overflowY: "auto", padding: "6px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "24px", textAlign: "left", color: "var(--color-text-muted)", fontSize: 13.5 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <Button
                key={cmd.id}
                variant="ghost"
                onClick={() => { router.push(cmd.href); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)",
                  background: i === activeIdx ? "var(--color-primary-muted)" : "transparent",
                  color: i === activeIdx ? "var(--color-primary)" : "var(--color-text)",
                  border: "none", cursor: "pointer", fontSize: 14,
                  fontFamily: "var(--font-sans)", textAlign: "left",
                  transition: "background var(--transition-fast), color var(--transition-fast)",
                }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <Icon size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                {cmd.label}
              </Button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          borderTop: "1px solid var(--color-border)", padding: "8px 16px",
          display: "flex", gap: 12, alignItems: "center",
        }}>
          {[["↑↓", "navigate"], ["↵", "open"], ["Esc", "close"]].map(([key, action]) => (
            <span key={key} style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
              <kbd style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid var(--color-border)",
                borderRadius: 4, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 10,
              }}>{key}</kbd>
              {action}
            </span>
          ))}
          <span style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center", fontSize: 11, color: "var(--color-primary)", opacity: 0.7 }}>
            <Zap size={12} /> RecruitFlow AI
          </span>
        </div>
      </div>
    </div>
  );
}
