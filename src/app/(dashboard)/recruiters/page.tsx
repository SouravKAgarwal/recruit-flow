import { RecruitersDataTable } from "@/components/recruiters/RecruitersDataTable";
import { RecruitersActionBar } from "@/components/recruiters/RecruitersActionBar";
import { SelectionProvider } from "@/components/recruiters/SelectionContext";
import { Suspense } from "react";
import { getRecruiters } from "@/app/actions/recruiters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Recruiters" };

async function ActionBar() {
  const recruiters = await getRecruiters();
  return <RecruitersActionBar recruiters={recruiters} />;
}

function ActionBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-8 w-25 rounded-md animate-pulse" />
      <Skeleton className="h-8 w-25 rounded-md animate-pulse" />
      <Skeleton className="h-8 w-25 rounded-md animate-pulse" />
    </div>
  );
}

export default function RecruitersPage() {
  return (
    <SelectionProvider>
      <div className="flex items-center justify-end gap-4 mb-5">
        <Suspense fallback={<ActionBarSkeleton />}>
          <ActionBar />
        </Suspense>
      </div>

      <RecruitersDataTable />
    </SelectionProvider>
  );
}
