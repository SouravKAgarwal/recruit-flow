import { format } from "date-fns";
import { FileText } from "lucide-react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TemplateRowActions } from "./TemplateRowActions";

interface Template {
  id: string;
  name: string;
  subject: string;
  updatedAt: Date;
}

export function TemplatesTable({ templates }: { templates: Template[] }) {
  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <SortableHeader sortKey="name">Name</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="subject">Subject Line</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="updatedAt">Last Updated</SortableHeader>
            </th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "var(--color-text-muted)",
                }}
              >
                <div className="flex flex-col items-center">
                  <FileText size={48} className="opacity-30 mb-4" />
                  <p className="text-sm">No templates found.</p>
                </div>
              </td>
            </tr>
          ) : (
            templates.map((t) => (
              <tr key={t.id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      fontSize: 14,
                    }}
                  >
                    <FileText
                      size={15}
                      style={{ color: "var(--color-text-muted)" }}
                    />
                    {t.name}
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: 13,
                      maxWidth: 300,
                    }}
                    className="truncate"
                  >
                    {t.subject || (
                      <span style={{ fontStyle: "italic", opacity: 0.5 }}>
                        No subject
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ color: "var(--color-text-dim)", fontSize: 13 }}>
                    {format(new Date(t.updatedAt), "MMM d, yyyy")}
                  </div>
                </td>
                <td>
                  <TemplateRowActions id={t.id} name={t.name} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
