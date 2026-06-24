"use client";

import { useTransition } from "react";
import { deleteRecruiter } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function RecruiterRowActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteRecruiter(id);
        toast("success", "Recruiter deleted");
      } catch (err) {
        toast("error", "Failed to delete recruiter", (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="icon" className="h-7 w-7 rounded-md" disabled={isPending} />}>
        <Trash2 size={12} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete recruiter?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            recruiter from your database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} variant="destructive">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
