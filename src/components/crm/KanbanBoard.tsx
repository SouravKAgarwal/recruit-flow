"use client";

import { useState, useTransition } from "react";
import { updateCrmStage } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";
import { formatDistanceToNow } from "date-fns";
import { Building2, Mail } from "lucide-react";

type Recruiter = {
  id: string; name: string; company: string; role: string;
  email: string; crmStage: string; lastContactedAt: Date | null; status: string;
};

const STAGES = [
  { id: "new",        label: "New",        color: "var(--color-text-muted)" },
  { id: "contacted",  label: "Contacted",  color: "var(--color-primary)" },
  { id: "replied",    label: "Replied",    color: "var(--color-warning)" },
  { id: "interview",  label: "Interview",  color: "#a78bfa" },
  { id: "offer",      label: "Offer",      color: "var(--color-success)" },
  { id: "rejected",   label: "Rejected",   color: "var(--color-danger)" },
  { id: "archived",   label: "Archived",   color: "var(--color-text-dim)" },
];

export function KanbanBoard({ recruiters: initial }: { recruiters: Recruiter[] }) {
  const [recruiters, setRecruiters] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const moveCard = (recruiterId: string, newStage: string) => {
    setRecruiters((prev) =>
      prev.map((r) => r.id === recruiterId ? { ...r, crmStage: newStage } : r)
    );
    startTransition(async () => {
      await updateCrmStage(recruiterId, newStage);
    });
  };

  const handleDrop = (stageId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragging) {
      moveCard(dragging, stageId);
      toast("success", "Moved to " + STAGES.find((s) => s.id === stageId)?.label);
    }
    setDragging(null);
  };

  return (
    <div>


      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
        {STAGES.map((stage) => {
          const stageRecruiters = recruiters.filter((r) => (r.crmStage || "new") === stage.id);
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-text-dim)", background: "var(--color-muted)", borderRadius: 10, padding: "1px 7px" }}>
                    {stageRecruiters.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {stageRecruiters.map((r) => (
                  <div
                    key={r.id}
                    className="kanban-card"
                    draggable
                    onDragStart={() => setDragging(r.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{ opacity: dragging === r.id ? 0.5 : 1 }}
                  >
                    <p style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name || "Unnamed"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
                      <Building2 size={11} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.company || "Unknown"} · {r.role || "Recruiter"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--color-text-dim)" }}>
                      <Mail size={11} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</span>
                    </div>
                    {r.lastContactedAt && (
                      <p style={{ fontSize: 10.5, color: "var(--color-text-dim)", marginTop: 6, borderTop: "1px solid var(--color-border)", paddingTop: 6 }}>
                        Last contacted {formatDistanceToNow(new Date(r.lastContactedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}

                {stageRecruiters.length === 0 && (
                  <div style={{
                    padding: "14px 10px", textAlign: "center",
                    border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
                    color: "var(--color-text-dim)", fontSize: 12,
                  }}>
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
