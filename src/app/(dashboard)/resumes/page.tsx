import { ResumeDropZone } from "@/components/resumes/ResumeDropZone";
import { ResumeList } from "@/components/resumes/ResumeList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";

export const metadata = { title: "Resumes" };

function ResumeListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="group overflow-hidden gap-0 py-0 border">
          <Skeleton className="w-full rounded-none shrink-0" style={{ height: 200 }} />
          <CardHeader className="py-4 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardFooter className="px-3 py-1.5 flex justify-end gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </CardFooter>
        </Card>
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
