import { getResumes } from "@/app/actions/resumes";
import { ResumeManager } from "@/components/resumes/ResumeManager";

export const metadata = { title: "Resumes" };

export default async function ResumesPage() {
  const resumes = await getResumes();
  return <ResumeManager resumes={resumes} />;
}
