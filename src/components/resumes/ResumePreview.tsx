"use client";

import dynamic from "next/dynamic";

const ResumeThumbnail = dynamic(
  () => import("./ResumeThumbnail").then((mod) => mod.ResumeThumbnail),
  { ssr: false },
);

const ResumePreview = ({ filename }: { filename: string }) => {
  return <ResumeThumbnail filename={filename} />;
};


export default ResumePreview