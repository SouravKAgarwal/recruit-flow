import { ResumeItem } from "./ResumeItem";

interface Resume {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  isActive: boolean;
  createdAt: Date;
}

export function ResumeList({ resumes }: { resumes: Resume[] }) {
  return (
    <div>
      {/* Resume list */}
      {resumes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "24px 0",
            color: "var(--color-text-muted)",
            fontSize: 13.5,
          }}
        >
          No resumes yet. Upload your first one above.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {resumes.map((r) => (
          <ResumeItem key={r.id} resume={r} />
        ))}
      </div>
    </div>
  );
}
