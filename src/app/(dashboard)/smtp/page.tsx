import { getSmtpAccounts } from "@/app/actions/smtp";
import { SmtpManager } from "@/components/smtp/SmtpManager";

export const metadata = { title: "SMTP Accounts" };

export default async function SmtpPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  let accounts = await getSmtpAccounts();

  // Apply search filtering
  if (q) {
    const query = q.toLowerCase();
    accounts = accounts.filter(
      (a) =>
        a.label.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.host.toLowerCase().includes(query) ||
        a.username.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  if (sort) {
    const [key, direction] = sort.split(":");
    accounts.sort((a: any, b: any) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div>
      <SmtpManager accounts={accounts} />
    </div>
  );
}
