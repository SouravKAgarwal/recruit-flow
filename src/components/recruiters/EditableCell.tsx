"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { updateRecruiter } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";

export function EditableCell({
  id,
  field,
  value: initial,
}: {
  id: string;
  field: string;
  value: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(initial);
  const [optimisticVal, setOptimisticVal] = useOptimistic(initial);
  const [_, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = (newValue: string) => {
    if (newValue === initial) return;

    startTransition(async () => {
      setOptimisticVal(newValue);
      try {
        await updateRecruiter(id, { [field]: newValue });
      } catch (err) {
        toast("error", "Failed to update", (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  if (editing) {
    return (
      <Input
        value={editVal}
        onChange={(e) => setEditVal(e.target.value)}
        onBlur={() => {
          handleSave(editVal);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave(editVal);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setEditVal(initial);
            setEditing(false);
          }
        }}
        autoFocus
        className="h-7 px-2 py-1 text-[13px] ring-0 focus-visible:ring-0 bg-background"
      />
    );
  }

  return (
    <span
      onClick={() => {
        setEditVal(optimisticVal);
        setEditing(true);
      }}
      style={{
        cursor: "text",
        display: "block",
        minWidth: 60,
        padding: "2px 0",
      }}
      title="Click to edit"
    >
      {optimisticVal || <span style={{ color: "var(--color-text-dim)" }}>—</span>}
    </span>
  );
}
