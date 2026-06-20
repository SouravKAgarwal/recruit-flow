import { ExternalLink } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { StatusSelect } from "./StatusSelect";
import { RecruiterRowActions } from "./RecruiterRowActions";
import { SelectRowCheckbox } from "./SelectionCheckboxes";
import { getRecruiters } from "@/app/actions/recruiters";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

type Recruiter = {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedin: string;
  location: string;
  status: string;
  tags: string;
  lastContactedAt: Date | null;
};

async function DynamicRecruitersDataTable({ size }: { size?: number }) {
  const data: Recruiter[] = await getRecruiters();

  const recruiters = size ? data.slice(0, 5) : data;

  return (
    <tbody>
      {recruiters.length === 0 && (
        <tr>
          <td colSpan={9} className="text-center p-12 text-muted">
            No recruiters found.
          </td>
        </tr>
      )}
      {recruiters.map((row) => (
        <tr key={row.id}>
          <td> <SelectRowCheckbox id={row.id} /> </td>
          <td> <EditableCell id={row.id} field="name" value={row.name} /></td>
          <td><EditableCell id={row.id} field="company" value={row.company} /></td>
          <td><EditableCell id={row.id} field="role" value={row.role} /></td>
          <td> <EditableCell id={row.id} field="email" value={row.email} /></td>
          <td><StatusSelect id={row.id} status={row.status} /> </td>
          <td>
            {row.linkedin ? (
              <a
                href={
                  row.linkedin.startsWith("http")
                    ? row.linkedin
                    : `https://${row.linkedin}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 text-xs"
              >
                Profile <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-text-dim">—</span>
            )}
          </td>
          <td><EditableCell id={row.id} field="location" value={row.location} /> </td>
          <td className="text-right"><RecruiterRowActions id={row.id} /></td>
        </tr>
      ))}
    </tbody>
  );
}

function TableSkeleton() {
  return (
    <tbody>
      {[...Array(3)].map((_, i) => (
        <tr key={i}>
          <td><Skeleton className="h-4 animate-pulse w-4 rounded" /></td>
          <td><Skeleton className="h-6 animate-pulse w-20" /></td>
          <td><Skeleton className="h-6 animate-pulse w-24" /></td>
          <td><Skeleton className="h-6 animate-pulse w-20" /></td>
          <td><Skeleton className="h-6 animate-pulse w-40" /></td>
          <td><Skeleton className="h-6 animate-pulse w-20 rounded-full" /></td>
          <td><Skeleton className="h-6 animate-pulse w-16" /></td>
          <td><Skeleton className="h-6 animate-pulse w-24" /></td>
          <td className="text-right"><Skeleton className="h-6 animate-pulse w-8 ml-auto rounded-md" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export function RecruitersDataTable({ size }: { size?: number }) {
  return (
    <div className="glass overflow-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th>Name</th>
            <th>Company</th>
            <th>Role</th>
            <th>Email</th>
            <th>Status</th>
            <th>LinkedIn</th>
            <th>Location</th>
            <th className="w-12 text-right">Action</th>
          </tr>
        </thead>
        <Suspense fallback={<TableSkeleton />}>
          <DynamicRecruitersDataTable size={size} />
        </Suspense>
      </table>
    </div>
  );
}
