import { TemplatesTable } from "@/components/templates/TemplatesTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-5">
        <div className="flex sm:w-auto gap-1">
          <Link href="/templates/new">
            <Button className="shadow-sm">
              <Plus size={16} />
              Create New
            </Button>
          </Link>
        </div>
      </div>

      <TemplatesTable />
    </div>
  );
}
