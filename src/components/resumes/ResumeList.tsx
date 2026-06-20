import { getResumes } from "@/app/actions/resumes";
import { ResumeItem } from "./ResumeItem";

export async function ResumeList() {
  const resumes = await getResumes();

  return (
    <div>
      {resumes.length === 0 && (
        <div className="text-center px-6 text-muted text-sm">
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
