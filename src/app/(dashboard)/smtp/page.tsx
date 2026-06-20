import { SmtpTable } from "@/components/smtp/SmtpTable";
import { AddSmtpButton } from "@/components/smtp/AddSmtpButton";

export const metadata = { title: "SMTP Accounts" };

export default function SmtpPage() {
  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-5">
        <div className="flex sm:w-auto">
          <AddSmtpButton />
        </div>
      </div>
      <SmtpTable />
    </div>
  );
}
