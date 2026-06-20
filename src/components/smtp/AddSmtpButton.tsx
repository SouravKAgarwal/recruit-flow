"use client";

import { useState } from "react";
import { addSmtpAccount } from "@/app/actions/smtp";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmtpForm } from "./SmtpForm";
import { useRouter } from "next/navigation";

export function AddSmtpButton() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setShowAdd(true)}>
        <Plus size={16} />
        <span className="hidden sm:inline">Add Account</span>
      </Button>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add SMTP Account"
        maxWidth={520}
      >
        <SmtpForm
          actionFn={addSmtpAccount}
          onSuccess={() => {
            toast("success", "SMTP account added");
            setShowAdd(false);
            router.refresh();
          }}
          submitLabel="Add Account"
        />
      </Modal>
    </>
  );
}
