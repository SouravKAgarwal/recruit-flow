"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTransition, useState, useEffect, useRef } from "react";

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);

  // Keep track of the last pushed query to avoid loops
  const lastPushedQ = useRef(initialQ);

  useEffect(() => {
    // Only set a timeout if the query actually changed relative to what we pushed last
    if (query === lastPushedQ.current) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      
      lastPushedQ.current = query;
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  // Update query if searchParams changes externally (e.g. back button)
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (currentQ !== lastPushedQ.current) {
      setQuery(currentQ);
      lastPushedQ.current = currentQ;
    }
  }, [searchParams]);

  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      {isPending ? (
        <Loader2
          size={14}
          className="animate-spin"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-primary)",
          }}
        />
      ) : (
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
          }}
        />
      )}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9 max-w-[360px]"
      />
    </div>
  );
}
