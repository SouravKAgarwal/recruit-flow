import { getResumes } from "@/app/actions/resumes";
import { CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import ResumeActions from "./ResumeActions";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import ResumePreview from "./ResumePreview";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function ResumeList() {
  const raw = await getResumes();
  const resumes = [...raw].sort(
    (a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0),
  );

  return (
    <div>
      {resumes.length === 0 && (
        <div className="text-center py-20 text-muted text-sm">
          No resumes yet. Upload your first one above.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.map((r) => (
          <Card
            key={r.id}
            className="group overflow-hidden gap-0 py-0 transition-all duration-200 border"
            style={{
              boxShadow: r.isActive
                ? "0 0 0 1px rgba(99,102,241,0.1), 0 8px 24px rgba(0,0,0,0.12)"
                : undefined,
            }}
          >
            <Link
              href={`/resumes/${r.filename}`}
              target="_blank"
              rel="noreferrer"
            >
              <div
                className="relative overflow-hidden"
                style={{ height: 200, background: "#f8f8f8", flexShrink: 0 }}
              >
                <ResumePreview filename={r.filename} />

                <div
                  className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(0,0,0,0.06))",
                  }}
                />

                {r.isActive && (
                  <div
                    className="absolute top-3 left-3 flex items-center gap-1 badge"
                    style={{
                      background: "rgba(99,102,241,0.92)",
                      color: "#fff",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
                    }}
                  >
                    <CheckCircle size={11} /> Active
                  </div>
                )}
              </div>
            </Link>

            <CardHeader className="py-2">
              <CardTitle className="truncate text-sm" title={r.originalName}>
                {r.originalName}
              </CardTitle>
              <CardAction>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    letterSpacing: "0.06em",
                  }}
                >
                  PDF
                </span>
              </CardAction>
              <CardDescription>
                {formatBytes(r.size)}
                <span className="mx-1 opacity-40">·</span>
                {formatDistanceToNow(new Date(r.createdAt), {
                  addSuffix: true,
                })}
              </CardDescription>
            </CardHeader>

            <CardFooter className="px-3 py-1.5">
              <ResumeActions r={r} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
