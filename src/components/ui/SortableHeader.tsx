"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { ReactNode } from "react";

export function SortableHeader({
  sortKey,
  children,
}: {
  sortKey: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort");
  const [currentKey, currentDirection] = currentSort?.split(":") ?? [];

  const isActive = currentKey === sortKey;
  const isAsc = isActive && currentDirection === "asc";
  const isDesc = isActive && currentDirection === "desc";

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (isActive && isAsc) {
      params.set("sort", `${sortKey}:desc`);
    } else if (isActive && isDesc) {
      params.delete("sort");
    } else {
      params.set("sort", `${sortKey}:asc`);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      onClick={toggleSort}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {children}
      {isAsc ? (
        <ChevronUp size={12} />
      ) : isDesc ? (
        <ChevronDown size={12} />
      ) : (
        <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />
      )}
    </div>
  );
}
