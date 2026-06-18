"use client";

import { useState, useTransition } from "react";
import { importRecruiters } from "@/app/actions/recruiters";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";

interface ParsedRow {
  name?: string;
  company?: string;
  role?: string;
  email?: string;
  linkedin?: string;
  location?: string;
}

function detectAndParse(raw: string): ParsedRow[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  // Detect .env style
  if (lines[0].includes("=") && !lines[0].includes(",")) {
    const rows: ParsedRow[] = [];
    let current: ParsedRow = {};
    for (const line of lines) {
      if (line.trim() === "" || line.startsWith("#")) {
        if (Object.keys(current).length > 0) {
          rows.push(current);
          current = {};
        }
        continue;
      }
      const [k, ...rest] = line.split("=");
      const v = rest.join("=").trim();
      const key = k.trim().toLowerCase();
      if (key === "name" || key === "recruiter_name") current.name = v;
      else if (key === "company" || key === "company_name") current.company = v;
      else if (key === "email") current.email = v;
      else if (key === "role") current.role = v;
      else if (key === "linkedin") current.linkedin = v;
      else if (key === "location") current.location = v;
    }
    if (Object.keys(current).length > 0) rows.push(current);
    return rows;
  }

  // Detect TSV vs CSV
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headerLine = lines[0].toLowerCase().replace(/"/g, "");
  const headerCols = headerLine.split(sep).map((h) => h.trim());

  const knownHeaders = [
    "name",
    "company",
    "role",
    "email",
    "linkedin",
    "location",
  ];
  const hasHeader = knownHeaders.some((h) => headerCols.includes(h));

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headers = hasHeader ? headerCols : guessHeaders(headerCols.length);

  return dataLines
    .map((line) => {
      const cells = line.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
      const row: ParsedRow = {};
      headers.forEach((h, i) => {
        const v = cells[i] ?? "";
        if (h.includes("name")) row.name = v;
        else if (h.includes("company")) row.company = v;
        else if (
          h.includes("role") ||
          h.includes("title") ||
          h.includes("position")
        )
          row.role = v;
        else if (h.includes("email") || h.includes("mail")) row.email = v;
        else if (h.includes("linkedin") || h.includes("link")) row.linkedin = v;
        else if (h.includes("location") || h.includes("city")) row.location = v;
      });
      return row;
    })
    .filter((r) => r.email || r.name);
}

function guessHeaders(count: number): string[] {
  const defaults = ["name", "company", "role", "email", "linkedin", "location"];
  return Array.from({ length: count }, (_, i) => defaults[i] ?? `col${i}`);
}

export function PasteImport({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (rows: ParsedRow[]) => void;
}) {
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleParse = () => {
    const rows = detectAndParse(raw);
    if (!rows.length) {
      toast("warning", "No data detected", "Check the format and try again.");
      return;
    }
    setPreview(rows);
    setStep("preview");
  };

  const handleImport = () => {
    startTransition(async () => {
      const res = await importRecruiters(preview);
      toast(
        "success",
        `Imported ${res.count} recruiters`,
        res.skipped ? `${res.skipped} duplicates skipped` : undefined,
      );
      onImport(preview);
    });
  };

  return (
    <Modal open onClose={onClose} title="Paste Recruiter Data" maxWidth={600}>
      {step === "input" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
            Paste data from Excel, Google Sheets or CSV format. We&apos;ll
            auto-detect the format.
          </p>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste your recruiter data here…"
            className="min-h-40 text-[12.5px] resize-none"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleParse} disabled={!raw.trim()}>
              Parse & Preview
            </Button>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
            Found{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {preview.length} rows
            </strong>
            . Review before importing:
          </p>
          <div
            style={{
              maxHeight: 300,
              overflow: "auto",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    "Name",
                    "Company",
                    "Role",
                    "Email",
                    "Linkedin",
                    "Location",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td>{row.name || "—"}</td>
                    <td>{row.company || "—"}</td>
                    <td>{row.role || "—"}</td>
                    <td>{row.email || "—"}</td>
                    <td>{row.linkedin || "—"}</td>
                    <td>{row.location || "—"}</td>
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        fontSize: 12,
                      }}
                    >
                      …and {preview.length - 20} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleImport} disabled={pending}>
              {pending ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : null}
              Import {preview.length} Recruiters
            </Button>
            <Button onClick={() => setStep("input")} variant="secondary">
              Back
            </Button>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
