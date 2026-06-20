import { getRecruiters } from "@/app/actions/recruiters";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "CRM Pipeline" };

async function DynamicBoard() {
  const recruiters = await getRecruiters();
  return <KanbanBoard recruiters={recruiters} />;
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 pb-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-75 glass flex flex-col"
          style={{ padding: "16px 14px" }}
        >
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CrmPage() {
  return (
    <div>
      <Suspense fallback={<BoardSkeleton />}>
        <DynamicBoard />
      </Suspense>
    </div>
  );
}
