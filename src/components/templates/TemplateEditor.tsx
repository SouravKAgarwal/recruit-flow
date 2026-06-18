"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  updatedAt: Date;
}

const VARIABLES = [
  "{{name}}",
  "{{company}}",
  "{{role}}",
  "{{resume_link}}",
  "{{custom}}",
];

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

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setSubject(initialTemplate.subject);
      setBody(initialTemplate.body);
    } else {
      setName("New Template");
      setSubject("");
      setBody("");
    }
  }, [initialTemplate]);

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
      } catch (err: any) {
        toast("error", "Error saving template", err.message);
      }
    });
  };

  const handleNew = () => {
    router.push("/templates");
  };

  const handleDelete = () => {
    if (!initialTemplate) return;
    startTransition(async () => {
      try {
        await deleteTemplate(initialTemplate.id);
        toast("success", "Template deleted");
        router.push("/templates");
      } catch (err: any) {
        toast("error", "Error deleting template", err.message);
      }
    });
  };

  const insertVariable = (v: string) => {
    setBody((prev) => prev + v);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {initialTemplate && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={isPending} />}>
              <Trash2 size={15} className="mr-1" /> Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &quot;{name}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this template from your database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button onClick={handleNew} variant="secondary" size="sm" disabled={isPending}>
          <Plus size={15} className="mr-1" /> New
        </Button>
        <Button onClick={handleSave} size="sm" disabled={isPending}>
          {isPending ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Save size={15} className="mr-1" />}
          Save
        </Button>
      </div>

      {/* Main Content: Split Pane */}
      <div className="flex-1 min-h-0 glass rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col lg:flex-row lg:divide-x divide-border">
        {/* LEFT PANE: Editor */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 lg:p-8 relative">
          <div className="flex flex-col gap-6 flex-1 min-h-[500px]">
            <div>
              <Label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Template Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template Name"
                disabled={isPending}
              />
            </div>

            <div>
              <Label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Subject Line
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject Line"
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <Label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: 0,
                  }}
                >
                  Email Body
                </Label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Variables:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map((v) => (
                      <Button
                        key={v}
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(v)}
                        title={`Insert ${v}`}
                        className="h-6 px-2 text-[11px] font-mono bg-muted/40"
                        disabled={isPending}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body…"
                className="flex-1 resize-none font-mono text-[14px] leading-relaxed p-4 min-h-[350px]"
                spellCheck={false}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Preview */}
        <div className="flex-1 h-full overflow-y-auto bg-muted/20 p-6 lg:p-8 flex flex-col items-center">
          <div className="w-full max-w-xl">
            <GmailPreview subject={subject} body={body} />
          </div>
        </div>
      </div>
    </div>
  );
}
