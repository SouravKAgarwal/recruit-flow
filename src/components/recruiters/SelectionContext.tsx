"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { bulkDeleteRecruiters } from "@/app/actions/recruiters";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";

type SelectionContextType = {
  selectedIds: Set<string>;
  toggleId: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clearSelection: () => void;
  handleBulkDelete: () => void;
  isPending: boolean;
};

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    if (selectedIds.size === ids.length && ids.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      try {
        await bulkDeleteRecruiters(ids);
        toast("success", `${ids.length} recruiters deleted`);
        clearSelection();
      } catch (err) {
        toast("error", "Failed to delete recruiters", (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  return (
    <SelectionContext.Provider
      value={{ selectedIds, toggleId, toggleAll, clearSelection, handleBulkDelete, isPending }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
