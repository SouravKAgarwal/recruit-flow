"use client";

import { useState, useRef } from "react";
import { uploadResume } from "@/app/actions/resumes";
import { useToast } from "@/components/ui/Toast";
import { Upload, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";

export function ResumeDropZone() {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadResume(fd);
    setUploading(false);
    if (res?.error) {
      toast("error", "Upload failed", res.error);
      return;
    }
    toast("success", "Resume uploaded");
    setOpen(false);
    router.refresh();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="flex justify-end mb-6">
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus size={16} /> Upload Resume
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Resume">
        <div
          className={`drop-zone ${dragging ? "drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
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
            <div className="flex flex-col items-center gap-2.5">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: "var(--color-primary)" }}
              />
              <p style={{ color: "var(--color-text-muted)" }}>Uploading…</p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-muted flex items-center justify-center">
                <Upload size={24} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4, textAlign: "center" }}>
                  Drop your resume here
                </p>
                <p style={{ color: "var(--color-text-muted)", fontSize: 13.5, textAlign: "center" }}>
                  or click to browse · PDF or DOCX
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
