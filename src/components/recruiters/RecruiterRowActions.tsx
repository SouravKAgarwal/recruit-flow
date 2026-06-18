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
      } catch (err: any) {
        toast("error", "Failed to delete recruiter", err.message);
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
          <AlertDialogTitle>Delete recruiter?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            recruiter from your database.
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
  );
}
