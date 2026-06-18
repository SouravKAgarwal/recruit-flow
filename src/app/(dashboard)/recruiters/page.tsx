import { getRecruiters } from "@/app/actions/recruiters";
import { RecruitersDataTable } from "@/components/recruiters/RecruitersDataTable";
import { RecruitersActionBar } from "@/components/recruiters/RecruitersActionBar";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectionProvider } from "@/components/recruiters/SelectionContext";

export const metadata = { title: "Recruiters" };

export default async function RecruitersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  let recruiters = await getRecruiters();

  // Apply search filtering
  if (q) {
    const query = q.toLowerCase();
    recruiters = recruiters.filter(
      (r) =>
        r.name?.toLowerCase().includes(query) ||
        r.company?.toLowerCase().includes(query) ||
        r.role?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.location?.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  if (sort) {
    const [key, direction] = sort.split(":");
    recruiters.sort((a: any, b: any) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <SelectionProvider>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Recruiters</h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {recruiters.length} contacts
          </p>
        </div>
        <RecruitersActionBar recruiters={recruiters} />
      </div>

      <SearchInput placeholder="Search recruiters…" />

      <RecruitersDataTable recruiters={recruiters} />
    </SelectionProvider>
  );
}
