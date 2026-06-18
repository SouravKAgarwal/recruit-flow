import { getSmtpAccounts } from "@/app/actions/smtp";
import { SmtpManager } from "@/components/smtp/SmtpManager";

export const metadata = { title: "SMTP Accounts" };

export default async function SmtpPage() {
  const accounts = await getSmtpAccounts();
  return <SmtpManager accounts={accounts} />;
}
