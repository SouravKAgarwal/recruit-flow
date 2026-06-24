"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Skeleton } from "@/components/ui/skeleton";
import { FileWarning } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function ResumeThumbnail({ filename }: { filename: string }) {
  return (
    <div className="w-full h-full flex items-start justify-center overflow-hidden pointer-events-none bg-muted/10">
      <Document
        file={`/resumes/${filename}`}
        error={
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
            <FileWarning size={36} className="mb-2 opacity-40 text-destructive" />
            <span className="text-xs font-medium opacity-80">Preview unavailable</span>
          </div>
        }
        loading={
          <div className="w-full h-full p-3 flex justify-center">
            <Skeleton className="w-[85%] h-full rounded shadow-sm border border-border/50" />
          </div>
        }
        renderMode="canvas"
      >
        <Page
          pageNumber={1}
          width={400}
          scale={0.8}
          renderMode="canvas"
          className="shadow-sm bg-white"
          loading={
            <div className="w-[320px] h-112.5 p-3 flex justify-center">
              <Skeleton className="w-full h-full rounded shadow-sm border border-border/50" />
            </div>
          }
        />
      </Document>
    </div>
  );
}
