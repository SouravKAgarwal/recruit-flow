import { ExternalLink } from "lucide-react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { EditableCell } from "./EditableCell";
import { StatusSelect } from "./StatusSelect";
import { RecruiterRowActions } from "./RecruiterRowActions";
import { SelectRowCheckbox, SelectAllCheckbox } from "./SelectionCheckboxes";

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

export function RecruitersDataTable({ recruiters }: { recruiters: Recruiter[] }) {
  const allIds = recruiters.map(r => r.id);

  return (
    <div className="glass" style={{ overflow: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <SelectAllCheckbox allIds={allIds} />
            </th>
            <th>
              <SortableHeader sortKey="name">Name</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="company">Company</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="role">Role</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="email">Email</SortableHeader>
            </th>
            <th>
              <SortableHeader sortKey="status">Status</SortableHeader>
            </th>
            <th>LinkedIn</th>
            <th>
              <SortableHeader sortKey="location">Location</SortableHeader>
            </th>
            <th style={{ width: 48, textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {recruiters.length === 0 && (
            <tr>
              <td
                colSpan={9}
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "var(--color-text-muted)",
                }}
              >
                No recruiters found.
              </td>
            </tr>
          )}
          {recruiters.map((row) => (
            <tr key={row.id}>
              <td>
                <SelectRowCheckbox id={row.id} />
              </td>
              <td>
                <EditableCell id={row.id} field="name" value={row.name} />
              </td>
              <td>
                <EditableCell id={row.id} field="company" value={row.company} />
              </td>
              <td>
                <EditableCell id={row.id} field="role" value={row.role} />
              </td>
              <td>
                <EditableCell id={row.id} field="email" value={row.email} />
              </td>
              <td>
                <StatusSelect id={row.id} status={row.status} />
              </td>
              <td>
                {row.linkedin ? (
                  <a
                    href={row.linkedin.startsWith("http") ? row.linkedin : `https://${row.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    Profile <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ color: "var(--color-text-dim)" }}>—</span>
                )}
              </td>
              <td>
                <EditableCell id={row.id} field="location" value={row.location} />
              </td>
              <td style={{ textAlign: "right" }}>
                <RecruiterRowActions id={row.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
