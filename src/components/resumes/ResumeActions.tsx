"use client";

import { useTransition } from "react";
import {
  setActiveResume,
  deleteResume,
  downloadResumeAction,
} from "@/app/actions/resumes";
import { useToast } from "@/components/ui/Toast";
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
import { Button } from "@/components/ui/button";
import { Trash2, Star, Download, Loader2 } from "lucide-react";
import type { Resume } from "@prisma/client";

const ResumeActions = ({ r }: { r: Resume }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSetActive = () => {
    startTransition(async () => {
      await setActiveResume(r.id);
      toast("success", "Active resume updated");
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteResume(r.id);
      toast("success", "Resume deleted");
    });
  };

  const handleDownload = async () => {
    toast("info", "Starting download...");
    try {
      const res = await downloadResumeAction(r.filename);
      if (!res.success) throw new Error("Failed to download");
      const url = `data:${res.mimeType};base64,${res.base64Data}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
    } catch (err) {
      toast(
        "error",
        "Download failed",
        err instanceof Error ? err.message : String(err),
      );
    }
  };
  return (
    <div className="flex items-center justify-end w-full">
      <div className="flex items-center gap-0.5">
        {!r.isActive && (
          <Button
            onClick={handleSetActive}
            variant="ghost"
            size="icon"
            title="Set as active"
          >
            <Star size={14} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          title="Download"
        >
          <Download size={14} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                style={{ color: "var(--color-danger)" }}
              />
            }
          >
            <Trash2 size={13} />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Trash2 className="text-red-500" />
              </AlertDialogMedia>
              <AlertDialogTitle className="text-sm">
                Delete &quot;{r.originalName}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                This action cannot be undone. This will permanently delete this
                resume.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} variant="destructive">
                {isPending ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="animate-spin" /> Deleting
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ResumeActions;
