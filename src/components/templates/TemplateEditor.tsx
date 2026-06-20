"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/app/actions/templates";
import { useToast } from "@/components/ui/Toast";
import { GmailPreview } from "./GmailPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Loader2,
  Minus,
  Maximize2,
  X,
  MoreVertical,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  updatedAt: Date;
}

export function TemplateEditor({
  initialTemplate,
}: {
  initialTemplate: Template | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialTemplate?.name ?? "New Template");
  const [subject, setSubject] = useState(initialTemplate?.subject ?? "");
  const [body, setBody] = useState(initialTemplate?.body ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (initialTemplate) {
          await updateTemplate(initialTemplate.id, { name, subject, body });
          toast("success", "Template saved");
        } else {
          const tpl = await createTemplate({
            name: name || "Untitled",
            subject,
            body,
          });
          toast("success", "Template created");
          router.push(`/templates?id=${tpl.id}`);
        }
      } catch (err) {
        toast(
          "error",
          "Error saving template",
          err instanceof Error ? err.message : String(err),
        );
      }
    });
  };

  const handleDelete = () => {
    if (!initialTemplate) return;
    startTransition(async () => {
      try {
        await deleteTemplate(initialTemplate.id);
        toast("success", "Template deleted");
        router.push("/templates");
      } catch (err) {
        toast(
          "error",
          "Error deleting template",
          err instanceof Error ? err.message : String(err),
        );
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8 relative items-stretch">
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="w-full h-full bg-white rounded-xl shadow-xl flex flex-col border border-gray-200 overflow-hidden">
          <div className="bg-[#f2f6fc] px-4 py-2.5 flex items-center justify-between border-b border-gray-200/60">
            <span className="text-sm font-medium text-[#202124]">
              {initialTemplate ? `Editing Template` : "New Template"}
            </span>
            <div className="flex items-center gap-3">
              <Minus
                size={16}
                className="text-[#5f6368] hover:text-[#202124] cursor-pointer"
              />
              <Maximize2
                size={14}
                className="text-[#5f6368] hover:text-[#202124] cursor-pointer"
              />
              <X
                size={18}
                className="text-[#5f6368] hover:text-[#202124] cursor-pointer"
                onClick={() => router.push("/templates")}
              />
            </div>
          </div>

          <div className="px-4 py-1.5 border-b border-gray-100 flex items-center gap-2 group focus-within:shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
            <span className="text-[#5f6368] text-[13px] w-12 shrink-0 select-none">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="flex-1 outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:border-0 border-none text-[14px] text-[#202124] py-1 bg-transparent"
              placeholder="Template Name"
            />
          </div>

          {/* Subject Field */}
          <div className="px-4 py-1.5 border-b border-gray-100 flex items-center group focus-within:shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPending}
              className="flex-1 outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:border-0 border-none text-[14px] text-[#202124] font-medium py-1 bg-transparent"
              placeholder="Subject"
            />
          </div>

          <div className="px-4 py-3 flex-1 flex flex-col min-h-0 bg-white cursor-text">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isPending}
              className="flex-1 outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:border-0 border-none text-[14px] text-[#202124] resize-none leading-relaxed font-sans"
              placeholder=""
              spellCheck={false}
            />
          </div>

          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSave}
                disabled={isPending}
                variant="outline"
                className="rounded-full shadow-sm px-6"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                Save Template
              </Button>
            </div>

            <div className="flex items-center gap-1 text-[#444746]">
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <MoreVertical size={18} />
              </button>

              {initialTemplate && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      />
                    }
                  >
                    <Trash2 size={18} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete &quot;{name}&quot;?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete this template.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-[#d93025] hover:bg-[#b3261e] text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Live Preview */}
      <div className="flex-1 min-w-0 h-full flex flex-col relative">
        <GmailPreview subject={subject} body={body} />
      </div>
    </div>
  );
}
