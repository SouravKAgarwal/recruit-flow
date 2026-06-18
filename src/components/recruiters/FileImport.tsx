"use client";

import { useState, useRef, useTransition } from "react";
import { importRecruiters } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Loader2 } from "lucide-react";

interface ParsedRow {
  name?: string; company?: string; role?: string;
  email?: string; linkedin?: string; location?: string;
}

function mapRow(raw: Record<string, string>): ParsedRow {
  const lower: Record<string, string> = {};
  for (const k in raw) lower[k.toLowerCase().trim()] = String(raw[k] ?? "").trim();
  return {
    name: lower.name || lower.recruiter_name || lower["full name"] || "",
    company: lower.company || lower.company_name || lower.organization || "",
    role: lower.role || lower.title || lower.position || lower.job_title || "",
    email: lower.email || lower.email_address || lower["e-mail"] || "",
    linkedin: lower.linkedin || lower.linkedin_url || "",
    location: lower.location || lower.city || lower.country || "",
  };
}

export function FileImport({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (rows: ParsedRow[]) => void;
}) {
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    const name = file.name.toLowerCase();
    let rows: ParsedRow[] = [];

    if (name.endsWith(".csv")) {
      const text = await file.text();
      const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      rows = result.data.map(mapRow);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      rows = raw.map(mapRow);
    } else if (name.endsWith(".json")) {
      const text = await file.text();
      const raw = JSON.parse(text);
      rows = (Array.isArray(raw) ? raw : [raw]).map(mapRow);
    } else {
      toast("error", "Unsupported format", "Please use CSV, XLSX, or JSON");
      return;
    }

    rows = rows.filter((r) => r.email || r.name);
    if (!rows.length) { toast("warning", "No data found in file"); return; }
    setPreview(rows);
    setStep("preview");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    startTransition(async () => {
      const res = await importRecruiters(preview);
      toast("success", `Imported ${res.count} recruiters`, res.skipped ? `${res.skipped} duplicates skipped` : undefined);
      onImport(preview);
    });
  };

  return (
    <Modal open onClose={onClose} title="Import from File" maxWidth={600}>
      {step === "upload" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
            Upload a CSV, XLSX, or JSON file. Columns are auto-detected.
          </p>
          <div
            className={`drop-zone ${dragging ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Input
              ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json" style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <Upload size={28} style={{ color: "var(--color-primary)", margin: "0 auto 10px" }} />
            <p style={{ fontWeight: 600 }}>Drop file or click to browse</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>CSV · XLSX · JSON</p>
          </div>
          <Button onClick={onClose} variant="ghost">Cancel</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
            Found <strong style={{ color: "var(--color-text)" }}>{preview.length} rows</strong>. Review before importing:
          </p>
          <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
            <table className="data-table">
              <thead><tr>{["Name", "Company", "Role", "Email"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td>{row.name || "—"}</td>
                    <td>{row.company || "—"}</td>
                    <td>{row.role || "—"}</td>
                    <td>{row.email || "—"}</td>
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 12 }}>…and {preview.length - 20} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleImport} disabled={pending}>
              {pending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Import {preview.length} Recruiters
            </Button>
            <Button onClick={() => setStep("upload")} variant="secondary">← Back</Button>
            <Button onClick={onClose} variant="ghost">Cancel</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
