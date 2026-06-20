import { RecruitersDataTable } from "@/components/recruiters/RecruitersDataTable";
import { SelectionProvider } from "@/components/recruiters/SelectionContext";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };


export default async function DashboardPage() {
  const size = 5;
  return (
    <div className="flex flex-col gap-6">
      <div className="glass flex flex-col">
        <div className="p-5 [border-bottom:1px_solid_var(--color-border)]">
          <h2 className="text-lg font-bold">Recent Pipeline</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Your latest tracked recruiters and their current status
          </p>
        </div>
        <div className="p-6">
          <SelectionProvider>
            <RecruitersDataTable size={size} />
          </SelectionProvider>
        </div>
      </div>
    </div>
  );
}
