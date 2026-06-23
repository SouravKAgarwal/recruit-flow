"use client";

import { useState, useTransition } from "react";
import {
  setActiveResume,
  deleteResume,
  renameResume,
  downloadResumeAction,
} from "@/app/actions/resumes";
import { useToast } from "@/components/ui/Toast";
import { Trash2, Star, Edit2, FileText, Download, CheckCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { useRouter } from "next/navigation";

interface Resume {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  isActive: boolean;
  createdAt: Date;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ResumeItem({ resume: r }: { resume: Resume }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(r.originalName);
  const { toast } = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleSetActive = () => {
    startTransition(async () => {
      await setActiveResume(r.id);
      toast("success", "Active resume updated");
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteResume(r.id);
      toast("success", "Resume deleted");
      router.refresh();
    });
  };

  const handleRename = () => {
    startTransition(async () => {
      await renameResume(r.id, renameVal);
      setIsRenaming(false);
      toast("success", "Renamed");
      router.refresh();
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
      toast("error", "Download failed", (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div
      className="glass"
      style={{
        padding: "16px 20px",
        borderColor: r.isActive ? "rgba(99,102,241,0.3)" : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            background: r.isActive
              ? "var(--color-primary-muted)"
              : "var(--color-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText
            size={18}
            style={{
              color: r.isActive
                ? "var(--color-primary)"
                : "var(--color-text-muted)",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                className="max-w-[300px]"
                autoFocus
              />
              <Button onClick={handleRename} size="sm">
                Save
              </Button>
              <Button
                onClick={() => setIsRenaming(false)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <p className="font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
                {r.originalName}
              </p>
              {r.isActive && (
                <span
                  className="badge"
                  style={{
                    background: "var(--color-primary-muted)",
                    color: "var(--color-primary)",
                  }}
                >
                  <CheckCircle size={10} /> Active
                </span>
              )}
            </div>
          )}
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: 12,
              marginTop: 2,
            }}
            className="truncate"
          >
            {formatBytes(r.size)} ·{" "}
            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <a
            href={`/resumes/${r.filename}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-icon btn-sm h-8 w-8"
            title="Preview"
          >
            <Eye size={14} />
          </a>
          <button
            onClick={handleDownload}
            className="btn btn-ghost btn-icon btn-sm h-8 w-8"
            title="Download"
          >
            <Download size={14} />
          </button>
          {!r.isActive && (
            <Button
              onClick={handleSetActive}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Set active"
            >
              <Star size={14} />
            </Button>
          )}
          <Button
            onClick={() => {
              setIsRenaming(true);
              setRenameVal(r.originalName);
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Edit2 size={13} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                />
              }
            >
              <Trash2 size={13} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &quot;{r.originalName}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this
                  resume from your database.
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
      </div>
    </div>
  );
}
