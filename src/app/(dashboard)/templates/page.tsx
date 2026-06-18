import { getTemplates } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplateList } from "@/components/templates/TemplateList";
import { redirect } from "next/navigation";

export const metadata = { title: "Templates" };

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const templates = await getTemplates();

  // Redirect to the first template if none selected and templates exist
  if (!id && templates.length > 0) {
    redirect(`/templates?id=${templates[0].id}`);
  }

  const activeTemplate = templates.find((t) => t.id === id) || null;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <h1 className="text-2xl font-extrabold tracking-tight">Templates</h1>
          {templates.length > 0 && (
            <div className="hidden sm:block w-px h-6 bg-border mx-2" />
          )}
          <TemplateList templates={templates} activeId={id || null} />
        </div>
      </div>

      <TemplateEditor initialTemplate={activeTemplate} />
    </div>
  );
}
