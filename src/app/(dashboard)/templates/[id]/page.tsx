import { getTemplates } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Edit Template" };

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let activeTemplate = null;

  if (id !== "new") {
    const templates = await getTemplates();
    activeTemplate = templates.find((t) => t.id === id) || null;

    if (!activeTemplate) {
      notFound();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100svh-10rem)] gap-4">
      <div className="flex items-center pl-2">
        <Link
          href="/templates"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Templates
        </Link>
      </div>
      <div className="flex-1 min-w-0 h-full flex flex-col">
        <TemplateEditor initialTemplate={activeTemplate} />
      </div>
    </div>
  );
}
