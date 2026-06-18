"use client";

import { useState, useTransition } from "react";
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
  const [val, setVal] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = (newValue: string) => {
    if (newValue === initial) return;
    
    startTransition(async () => {
      try {
        await updateRecruiter(id, { [field]: newValue });
      } catch (err: any) {
        toast("error", "Failed to update", err.message);
        setVal(initial); // revert on error
      }
    });
  };

  if (editing) {
    return (
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          handleSave(val);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave(val);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setVal(initial);
            setEditing(false);
          }
        }}
        autoFocus
        className="h-7 px-2 py-1 text-[13px] ring-0 focus-visible:ring-0 bg-background"
        disabled={isPending}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        cursor: "text",
        display: "block",
        minWidth: 60,
        padding: "2px 0",
        opacity: isPending ? 0.5 : 1,
      }}
      title="Click to edit"
    >
      {val || <span style={{ color: "var(--color-text-dim)" }}>—</span>}
    </span>
  );
}
