"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateSmtpAccount,
  deleteSmtpAccount,
  setDefaultSmtp,
  testSmtpConnection,
} from "@/app/actions/smtp";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import {
  Trash2,
  Edit2,
  Star,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SmtpForm } from "./SmtpForm";
import type { SmtpAccount } from "@prisma/client";

export function SmtpRowActions({ account }: { account: SmtpAccount }) {
  const [editOpen, setEditOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteSmtpAccount(account.id);
      toast("success", "Account deleted");
      router.refresh();
    });
  };

  const handleSetDefault = () => {
    startTransition(async () => {
      await setDefaultSmtp(account.id);
      router.refresh();
    });
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await testSmtpConnection(account.id);
    setTestResult(!res.error);
    setTesting(false);
    if (res.error) toast("error", "Connection failed", res.error);
    else toast("success", "Connection successful!");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 16,
        }}
      >
        <div style={{ marginRight: "auto" }}>
          {testResult === true && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-success)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <CheckCircle size={12} /> Connected
            </span>
          )}
          {testResult === false && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-danger)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <XCircle size={12} /> Failed
            </span>
          )}
          {testResult === null && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <Minus size={12} /> Unverified
            </span>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Button
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            title="Test Connection"
          >
            {testing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
          </Button>
          {!account.isDefault && (
            <Button
              onClick={handleSetDefault}
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              title="Set as default"
            >
              <Star size={13} />
            </Button>
          )}
          <Button
            onClick={() => setEditOpen(true)}
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            title="Edit account"
          >
            <Edit2 size={13} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  title="Delete account"
                />
              }
            >
              <Trash2 size={13} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this SMTP account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  SMTP account from your database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit SMTP Account"
        maxWidth={520}
      >
        <SmtpForm
          initial={account}
          actionFn={updateSmtpAccount.bind(null, account.id)}
          onSuccess={() => {
            toast("success", "Account updated");
            setEditOpen(false);
            router.refresh();
          }}
          submitLabel="Save Changes"
        />
      </Modal>
    </>
  );
}
