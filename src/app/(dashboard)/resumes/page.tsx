import { ResumeDropZone } from "@/components/resumes/ResumeDropZone";
import { ResumeList } from "@/components/resumes/ResumeList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Resumes" };

function ResumeListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 mt-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="glass flex items-center gap-4"
          style={{ padding: "16px 20px" }}
        >
          <Skeleton className="w-[40px] h-[40px] rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResumesPage() {
  return (
    <div>
      <ResumeDropZone />
      <Suspense fallback={<ResumeListSkeleton />}>
        <ResumeList />
      </Suspense>
    </div>
  );
}
