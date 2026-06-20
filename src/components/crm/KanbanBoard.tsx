"use client";

import { useState, useOptimistic, useTransition } from "react";
import { updateCrmStage } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Recruiter = {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  crmStage: string;
  lastContactedAt: Date | null;
  status: string;
};

const STAGES = [
  { id: "new", label: "New", color: "var(--color-text-muted)" },
  { id: "contacted", label: "Contacted", color: "var(--color-primary)" },
  { id: "replied", label: "Replied", color: "var(--color-warning)" },
  { id: "interview", label: "Interview", color: "#a78bfa" },
  { id: "offer", label: "Offer", color: "var(--color-success)" },
  { id: "rejected", label: "Rejected", color: "var(--color-danger)" },
  { id: "archived", label: "Archived", color: "var(--color-text-dim)" },
];

export function KanbanBoard({
  recruiters: initial,
}: {
  recruiters: Recruiter[];
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [_, startTransition] = useTransition();
  const { toast } = useToast();

  const [optimisticRecruiters, setOptimisticRecruiters] = useOptimistic(
    initial,
    (state, { id, newStage }: { id: string; newStage: string }) =>
      state.map((r) => (r.id === id ? { ...r, crmStage: newStage } : r))
  );

  const moveCard = (recruiterId: string, newStage: string) => {
    startTransition(async () => {
      setOptimisticRecruiters({ id: recruiterId, newStage });
      await updateCrmStage(recruiterId, newStage);
    });
  };

  const handleDrop = (stageId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragging) {
      moveCard(dragging, stageId);
      toast(
        "success",
        "Moved to " + STAGES.find((s) => s.id === stageId)?.label,
      );
    }
    setDragging(null);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 16,
        }}
      >
        {STAGES.map((stage) => {
          const stageRecruiters = optimisticRecruiters.filter(
            (r) => (r.crmStage || "new") === stage.id,
          );
          return (
            <div
              key={stage.id}
              className="kanban-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop(stage.id)}
              style={{ minWidth: 220 }}
            >
              {/* Column header */}
              <div style={{ marginBottom: 10, padding: "2px 4px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: stage.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted rounded-2xl px-px py-1.5">
                    {stageRecruiters.length}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {stageRecruiters.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "kanban-card",
                      dragging === r.id ? "opacity-50" : "opacity-100",
                    )}
                    draggable
                    onDragStart={() => setDragging(r.id)}
                    onDragEnd={() => setDragging(null)}
                  >
                    <p className="font-semibold text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {r.name || "Unnamed"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <Building2 size={11} />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {r.company || "Unknown"} · {r.role || "Recruiter"}
                      </span>
                    </div>
                  </div>
                ))}

                {stageRecruiters.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs px-3.5 py-2.5 border border-dashed border-border">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
