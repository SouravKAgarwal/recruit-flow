"use client";

import { useTransition } from "react";
import { updateRecruiter } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "var(--color-muted)", color: "var(--color-text-muted)" },
  CONTACTED: {
    bg: "var(--color-primary-muted)",
    color: "var(--color-primary)",
  },
  REPLIED: { bg: "var(--color-warning-muted)", color: "var(--color-warning)" },
  INTERVIEW: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
  OFFER: { bg: "var(--color-success-muted)", color: "var(--color-success)" },
  REJECTED: { bg: "var(--color-danger-muted)", color: "var(--color-danger)" },
};

export function StatusSelect({ id, status: initial }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleStatusChange = (val: string | null) => {
    if (!val) return;
    startTransition(async () => {
      try {
        await updateRecruiter(id, { status: val });
      } catch (err: any) {
        toast("error", "Failed to update status", err.message);
      }
    });
  };

  const s = initial || "NEW";
  const c = STATUS_COLORS[s] ?? STATUS_COLORS.NEW;

  return (
    <Select value={s} onValueChange={handleStatusChange} disabled={isPending}>
      <SelectTrigger
        className="rounded-sm! badge h-6 border-none ring-0 focus:ring-0 shadow-none hover:opacity-80 transition-opacity"
        style={{
          background: c.bg,
          color: c.color,
          width: "80px",
          justifyContent: "space-between",
          opacity: isPending ? 0.5 : 1,
        }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(STATUS_COLORS).map((st) => (
          <SelectItem key={st} value={st} className="text-xs font-medium">
            {st}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
