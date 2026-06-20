import { getTemplates } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import prisma from "@/lib/prisma";

export async function generateStaticParams() {
  const templates = await prisma.emailTemplate.findMany();

  const ids = templates.map((t) => ({ id: t.id }));
  return [...ids, { id: "new" }];
}

export const metadata: Metadata = { title: "Edit Template" };

async function TemplateContent({
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
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <TemplateEditor
        key={activeTemplate?.id || "new"}
        initialTemplate={activeTemplate}
      />
    </div>
  );
}

function TemplateEditorSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-4 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="flex-1 w-full" />
    </div>
  );
}

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <Suspense fallback={<TemplateEditorSkeleton />}>
        <TemplateContent params={params} />
      </Suspense>
    </div>
  );
}
