"use client";

import { useState } from "react";
import { Download, Upload, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelection } from "./SelectionContext";
import { PasteImport } from "./PasteImport";
import { FileImport } from "./FileImport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

type Recruiter = {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedin: string;
  location: string;
  status: string;
};

export function RecruitersActionBar({ recruiters }: { recruiters: Recruiter[] }) {
  const { selectedIds, handleBulkDelete, isPending } = useSelection();
  const [showPaste, setShowPaste] = useState(false);
  const [showFile, setShowFile] = useState(false);
  const router = useRouter();

  const exportCsv = () => {
    const header = [
      "Name",
      "Company",
      "Role",
      "Email",
      "LinkedIn",
      "Location",
      "Status",
    ];
    const rows = recruiters.map((r) =>
      [r.name, r.company, r.role, r.email, r.linkedin, r.location, r.status]
        .map((v) => `"${v}"`)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recruiters.csv";
    a.click();
  };

  const handleImported = () => {
    setShowPaste(false);
    setShowFile(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {selectedIds.size > 0 && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" className="h-8 px-2 sm:px-3 rounded-md" disabled={isPending} />}>
              <Trash2 size={13} className="sm:mr-2" /> <span className="hidden sm:inline">Delete {selectedIds.size}</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {selectedIds.size} recruiters?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  the selected recruiters from your database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button variant="secondary" size="sm" onClick={exportCsv} className="h-8 px-2 sm:px-3 rounded-md" title="Export CSV">
          <Download size={13} className="sm:mr-2" /> <span className="hidden sm:inline">Export CSV</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPaste(true)}
          className="h-8 px-2 sm:px-3 rounded-md"
          title="Paste Data"
        >
          <Filter size={13} className="sm:mr-2" /> <span className="hidden sm:inline">Paste Data</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFile(true)}
          className="h-8 px-2 sm:px-3 rounded-md"
          title="Import File"
        >
          <Upload size={13} className="sm:mr-2" /> <span className="hidden sm:inline">Import File</span>
        </Button>
      </div>

      {showPaste && (
        <PasteImport
          onClose={() => setShowPaste(false)}
          onImport={handleImported}
        />
      )}
      {showFile && (
        <FileImport
          onClose={() => setShowFile(false)}
          onImport={handleImported}
        />
      )}
    </>
  );
}
