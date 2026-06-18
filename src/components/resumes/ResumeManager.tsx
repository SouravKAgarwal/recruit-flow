"use client";

import { useState, useRef, useTransition } from "react";
import { uploadResume, setActiveResume, deleteResume, renameResume } from "@/app/actions/resumes";
import { useToast } from "@/components/ui/Toast";
import {
  Upload, Trash2, Star, Edit2, FileText, Download,
  CheckCircle, Loader2, File,
} from "lucide-react";
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

interface Resume {
  id: string; originalName: string; filename: string;
  size: number; isActive: boolean; createdAt: Date;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ResumeManager({ resumes: initial }: { resumes: Resume[] }) {
  const [resumes, setResumes] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadResume(fd);
    setUploading(false);
    if (res?.error) { toast("error", "Upload failed", res.error); return; }
    toast("success", "Resume uploaded");
    window.location.reload();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      await setActiveResume(id);
      setResumes((prev) => prev.map((r) => ({ ...r, isActive: r.id === id })));
      toast("success", "Active resume updated");
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast("success", "Resume deleted");
    });
  };

  const handleRename = (id: string) => {
    startTransition(async () => {
      await renameResume(id, renameVal);
      setResumes((prev) => prev.map((r) => r.id === id ? { ...r, originalName: renameVal } : r));
      setRenamingId(null);
      toast("success", "Renamed");
    });
  };

  return (
    <div>


      {/* Drop zone */}
      <div
        className={`drop-zone ${dragging ? "drag-over" : ""}`}
        style={{ marginBottom: 24 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <Input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
            <p style={{ color: "var(--color-text-muted)" }}>Uploading…</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--color-primary-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={24} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop your resume here</p>
              <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>
                or click to browse · PDF or DOCX
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resume list */}
      {resumes.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)", fontSize: 13.5 }}>
          No resumes yet. Upload your first one above.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {resumes.map((r) => (
          <div key={r.id} className="glass" style={{
            padding: "16px 20px",
            borderColor: r.isActive ? "rgba(99,102,241,0.3)" : undefined,
          }}>
            <div className="flex items-center gap-4">
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: r.isActive ? "var(--color-primary-muted)" : "var(--color-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText size={18} style={{ color: r.isActive ? "var(--color-primary)" : "var(--color-text-muted)" }} />
              </div>

              <div className="flex-1 min-w-0">
                {renamingId === r.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(r.id)}
                      className="max-w-[300px]"
                      autoFocus
                    />
                    <Button onClick={() => handleRename(r.id)} size="sm">Save</Button>
                    <Button onClick={() => setRenamingId(null)} variant="ghost" size="sm">Cancel</Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p className="font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
                      {r.originalName}
                    </p>
                    {r.isActive && (
                      <span className="badge" style={{ background: "var(--color-primary-muted)", color: "var(--color-primary)" }}>
                        <CheckCircle size={10} /> Active
                      </span>
                    )}
                  </div>
                )}
                <p style={{ color: "var(--color-text-muted)", fontSize: 12, marginTop: 2 }} className="truncate">
                  {formatBytes(r.size)} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <a
                  href={`/api/resume/${r.filename}`}
                  download={r.originalName}
                  className="btn btn-ghost btn-icon btn-sm"
                  title="Download"
                >
                  <Download size={14} />
                </a>
                {!r.isActive && (
                  <Button onClick={() => handleSetActive(r.id)} variant="ghost" size="icon" className="h-8 w-8" title="Set active">
                    <Star size={14} />
                  </Button>
                )}
                <Button
                  onClick={() => { setRenamingId(r.id); setRenameVal(r.originalName); }}
                  variant="ghost" size="icon" className="h-8 w-8"
                >
                  <Edit2 size={13} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive" size="icon" className="h-8 w-8 rounded-md" />}>
                    <Trash2 size={13} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &quot;{r.originalName}&quot;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this resume from your database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
