import { getRecruiters } from "@/app/actions/recruiters";
import { KanbanBoard } from "@/components/crm/KanbanBoard";

export const metadata = { title: "CRM Pipeline" };

export default async function CrmPage() {
  const recruiters = await getRecruiters();
  return <KanbanBoard recruiters={recruiters} />;
}
