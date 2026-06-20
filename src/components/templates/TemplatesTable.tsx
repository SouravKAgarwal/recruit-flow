import { format } from "date-fns";
import { FileText } from "lucide-react";
import { TemplateRowActions } from "./TemplateRowActions";
import { getTemplates } from "@/app/actions/templates";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Template {
  id: string;
  name: string;
  subject: string;
  updatedAt: Date;
}

async function DynamicTemplateTable() {
  const templates: Template[] = await getTemplates();

  return (
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
  );
}

function TableSkeleton() {
  return (
    <tbody>
      {[...Array(4)].map((_, i) => (
        <tr key={i}>
          <td>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </td>
          <td>
            <Skeleton className="h-4 w-48" />
          </td>
          <td>
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="text-right">
            <Skeleton className="h-8 w-8 ml-auto rounded-md" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function TemplatesTable() {
  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Subject Line</th>
            <th>Last Updated</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>

        <Suspense fallback={<TableSkeleton />}>
          <DynamicTemplateTable />
        </Suspense>
      </table>
    </div>
  );
}
