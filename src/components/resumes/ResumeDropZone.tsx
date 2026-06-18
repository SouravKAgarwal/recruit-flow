"use client";

import { useState, useRef } from "react";
import { uploadResume } from "@/app/actions/resumes";
import { useToast } from "@/components/ui/Toast";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function ResumeDropZone() {
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
    router.refresh();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      className={`drop-zone ${dragging ? "drag-over" : ""}`}
      style={{ marginBottom: 24 }}
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
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
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "var(--color-primary-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload size={24} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Drop your resume here
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>
              or click to browse · PDF or DOCX
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
