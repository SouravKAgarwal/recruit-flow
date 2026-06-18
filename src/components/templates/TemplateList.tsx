"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TemplateList({
  templates,
  activeId,
}: {
  templates: { id: string; name: string }[];
  activeId: string | null;
}) {
  const router = useRouter();

  if (templates.length === 0) return null;

  return (
    <Select
      value={activeId || ""}
      onValueChange={(val) => {
        router.push(`/templates?id=${val}`);
      }}
    >
      <SelectTrigger className="w-[240px] bg-card border-border shadow-sm">
        <SelectValue placeholder="Select a template">
          {(val: any) => {
            const found = templates.find(t => t.id === val);
            return found ? found.name : null;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {templates.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
