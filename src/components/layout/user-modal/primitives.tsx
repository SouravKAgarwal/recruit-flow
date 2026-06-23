import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ExternalLink } from "lucide-react";

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-7 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-7 pt-5 pb-1.5 border-b border-border">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

export function Toggle({
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

export function ThemeSegment() {
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
            className={`text-xs px-2.5 py-1 rounded-md transition-all duration-150 border-none cursor-pointer font-medium capitalize ${active ? "bg-background text-foreground shadow-sm" : "bg-transparent text-muted-foreground"}`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function NavBtn({
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
      className="flex items-center justify-between px-7 py-3 no-underline text-foreground hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <ExternalLink size={13} className="text-muted-foreground opacity-60" />
    </a>
  );
}
