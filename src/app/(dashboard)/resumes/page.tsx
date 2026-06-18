import { getResumes } from "@/app/actions/resumes";
import { ResumeDropZone } from "@/components/resumes/ResumeDropZone";
import { ResumeList } from "@/components/resumes/ResumeList";

export const metadata = { title: "Resumes" };

export default async function ResumesPage() {
  const resumes = await getResumes();
  return (
    <div>
      <ResumeDropZone />
      <ResumeList resumes={resumes} />
    </div>
  );
}
