"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useSelection } from "./SelectionContext";

export function SelectRowCheckbox({ id }: { id: string }) {
  const { selectedIds, toggleId, isPending } = useSelection();
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={selectedIds.has(id)}
        onCheckedChange={() => toggleId(id)}
        disabled={isPending}
      />
    </div>
  );
}

export function SelectAllCheckbox({ allIds }: { allIds: string[] }) {
  const { selectedIds, toggleAll, isPending } = useSelection();
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={selectedIds.size === allIds.length && allIds.length > 0}
        onCheckedChange={() => toggleAll(allIds)}
        disabled={isPending}
      />
    </div>
  );
}
