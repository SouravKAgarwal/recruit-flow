"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplate } from "@/app/actions/templates";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
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

export function TemplateRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
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
        onClick={() => router.push(`/templates/${id}`)}
        disabled={isPending}
        className="h-7 w-7 rounded-md"
        title="Edit template"
      >
        <Edit2 size={13} />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={isPending}
              title="Delete template"
            />
          }
        >
          <Trash2 size={13} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              template.
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
    </div>
  );
}
