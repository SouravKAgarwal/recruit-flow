import { getTemplates } from "@/app/actions/templates";
import { TemplatesTable } from "@/components/templates/TemplatesTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  let templates = await getTemplates();

  if (q) {
    const query = q.toLowerCase();
    templates = templates.filter(
      (t) =>
        t.name?.toLowerCase().includes(query) ||
        t.subject?.toLowerCase().includes(query),
    );
  }

  if (sort) {
    const [key, direction] = sort.split(":");
    templates.sort((a: any, b: any) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex-1">
          <SearchInput placeholder="Search templates…" />
        </div>
        <div className="flex sm:w-auto gap-2">
          <Link href="/templates/new">
            <Button className="shadow-sm">
              <Plus size={16} className="mr-2" />
              Create New
            </Button>
          </Link>
        </div>
      </div>

      <TemplatesTable templates={templates} />
    </div>
  );
}
