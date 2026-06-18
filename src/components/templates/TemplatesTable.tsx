"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { deleteTemplate } from "@/app/actions/templates";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, FileText } from "lucide-react";
import { SortableHeader } from "@/components/ui/SortableHeader";
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

interface Template {
  id: string;
  name: string;
  subject: string;
  updatedAt: Date;
}

export function TemplatesTable({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      try {
        await deleteTemplate(id);
        toast("success", `Template "${name}" deleted`);
        router.refresh();
      } catch (err: any) {
        toast("error", "Error deleting template", err.message);
      }
    });
  };

  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <SortableHeader sortKey="name">Name</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="subject">Subject Line</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="updatedAt">Last Updated</SortableHeader>
            </th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "var(--color-text-muted)",
                }}
              >
                <div className="flex flex-col items-center">
                  <FileText size={48} className="opacity-30 mb-4" />
                  <p className="text-sm">No templates found.</p>
                </div>
              </td>
            </tr>
          ) : (
            templates.map((t) => (
              <tr key={t.id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      fontSize: 14,
                    }}
                  >
                    <FileText
                      size={15}
                      style={{ color: "var(--color-text-muted)" }}
                    />
                    {t.name}
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: 13,
                      maxWidth: 300,
                    }}
                    className="truncate"
                  >
                    {t.subject || (
                      <span style={{ fontStyle: "italic", opacity: 0.5 }}>
                        No subject
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ color: "var(--color-text-dim)", fontSize: 13 }}>
                    {format(new Date(t.updatedAt), "MMM d, yyyy")}
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 6,
                    }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/templates/${t.id}`)}
                      disabled={isPending}
                      className="h-7 w-7 rounded-md"
                      title="Edit template"
                    >
                      <Edit2 size={13} />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 rounded-md"
                          disabled={isPending}
                          title="Delete template"
                        />
                      }>
                        <Trash2 size={13} />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete &quot;{t.name}&quot;?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this template.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(t.id, t.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
