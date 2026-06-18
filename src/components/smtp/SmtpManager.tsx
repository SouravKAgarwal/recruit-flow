"use client";

import { useState, useTransition } from "react";
import {
  addSmtpAccount, updateSmtpAccount, deleteSmtpAccount,
  setDefaultSmtp, testSmtpConnection,
} from "@/app/actions/smtp";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import {
  Plus, Trash2, Edit2, Star, CheckCircle, XCircle,
  Loader2, Mail, Server, RefreshCw,
} from "lucide-react";
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

interface SmtpAccount {
  id: string; label: string; senderName: string; email: string;
  host: string; port: number; username: string; tls: boolean;
  isDefault: boolean; emailsSent: number; lastUsedAt: Date | null;
}

interface SmtpManagerProps {
  accounts: SmtpAccount[];
}

const PROVIDER_PRESETS = [
  { name: "Gmail",   host: "smtp.gmail.com",    port: 587, tls: true },
  { name: "Outlook", host: "smtp.office365.com", port: 587, tls: true },
  { name: "Zoho",    host: "smtp.zoho.com",       port: 587, tls: true },
  { name: "Custom",  host: "",                   port: 587, tls: true },
];

import { useActionState, useEffect } from "react";
import type { SmtpActionState } from "@/app/actions/smtp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SmtpForm({
  initial,
  actionFn,
  submitLabel,
  onSuccess,
}: {
  initial?: Partial<SmtpAccount>;
  actionFn: (prevState: SmtpActionState, formData: FormData) => Promise<SmtpActionState>;
  submitLabel: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<SmtpActionState, FormData>(actionFn, undefined);
  const [preset, setPreset] = useState("Custom");
  const [port, setPort] = useState(initial?.port ?? 587);
  const [tls, setTls] = useState(initial?.tls ?? true);
  const [host, setHost] = useState(initial?.host ?? "");

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const applyPreset = (name: string) => {
    const p = PROVIDER_PRESETS.find((x) => x.name === name);
    if (!p) return;
    setPreset(name);
    if (p.host) setHost(p.host);
    setPort(p.port);
    setTls(p.tls);
  };

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {state?.error && (
        <div style={{
          background: "var(--color-danger-muted)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "var(--radius-md)", padding: "10px 14px",
          color: "var(--color-danger)", fontSize: 13.5,
        }}>
          {state.error}
        </div>
      )}

      {/* Provider presets */}
      <div>
        <Label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Provider</Label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PROVIDER_PRESETS.map((p) => (
            <Button key={p.name} type="button" onClick={() => applyPreset(p.name)}
              variant={preset === p.name ? "default" : "secondary"} size="sm">
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="label">Account label *</Label>
          <Input id="label" name="label" required defaultValue={initial?.label} placeholder="Gmail - Work" aria-invalid={!!state?.errors?.label} />
          {state?.errors?.label && <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{state.errors.label[0]}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="senderName">Sender name</Label>
          <Input id="senderName" name="senderName" defaultValue={initial?.senderName} placeholder="Alex Johnson" />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor="email">Email address *</Label>
        <Input id="email" name="email" type="email" required defaultValue={initial?.email} placeholder="you@gmail.com" aria-invalid={!!state?.errors?.email} />
        {state?.errors?.email && <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{state.errors.email[0]}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="host">SMTP host *</Label>
          <Input id="host" name="host" required value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" aria-invalid={!!state?.errors?.host} />
          {state?.errors?.host && <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{state.errors.host[0]}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="port">Port</Label>
          <Input id="port" name="port" type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} aria-invalid={!!state?.errors?.port} />
          {state?.errors?.port && <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{state.errors.port[0]}</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor="username">Username *</Label>
        <Input id="username" name="username" required defaultValue={initial?.username} placeholder="you@gmail.com" aria-invalid={!!state?.errors?.username} />
        {state?.errors?.username && <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{state.errors.username[0]}</span>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor="password">Password / App password *</Label>
        <Input id="password" name="password" type="password" required={!initial} placeholder={initial ? "Leave blank to keep existing" : "••••••••"} aria-invalid={!!state?.errors?.password} />
        {state?.errors?.password && <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{state.errors.password[0]}</span>}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5 }}>
        <input type="hidden" name="tls" value={tls ? "true" : "false"} />
        <div
          onClick={() => setTls((t) => !t)}
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: tls ? "var(--color-primary)" : "var(--color-border-strong)",
            position: "relative", cursor: "pointer", transition: "background 200ms",
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: "50%", background: "var(--color-surface)",
            position: "absolute", top: 3, left: tls ? 18 : 3,
            transition: "left 200ms",
          }} />
        </div>
        <span style={{ color: "var(--color-text-muted)" }}>Enable TLS/SSL</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full mt-4">
        {pending ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving…</> : submitLabel}
      </Button>
    </form>
  );
}



export function SmtpManager({ accounts: initial }: SmtpManagerProps) {
  const [accounts, setAccounts] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteSmtpAccount(id);
      toast("success", "Account deleted");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    });
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      await setDefaultSmtp(id);
      setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    });
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    const res = await testSmtpConnection(id);
    setTestResult((prev) => ({ ...prev, [id]: !res.error }));
    setTesting(null);
    if (res.error) toast("error", "Connection failed", res.error);
    else toast("success", "Connection successful!");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>SMTP Accounts</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: 4 }}>
            Manage your email sending accounts
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="h-8 px-2 sm:px-3 sm:w-auto rounded-md" title="Add Account">
          <Plus size={16} className="sm:mr-2" /> <span className="hidden sm:inline">Add Account</span>
        </Button>
      </div>

      {accounts.length === 0 && (
        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
          <Server size={40} style={{ color: "var(--color-text-dim)", margin: "0 auto 16px" }} />
          <p style={{ fontWeight: 600, marginBottom: 8 }}>No SMTP accounts yet</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5, marginBottom: 20 }}>
            Add your first email account to start sending campaigns
          </p>
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} className="mr-2" /> Add Account
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {accounts.map((acc) => (
          <div key={acc.id} className="glass" style={{ padding: 20 }}>
            <div className="flex items-center gap-4">
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: "var(--color-primary-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Mail size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }} className="truncate max-w-[200px] sm:max-w-none">{acc.label}</p>
                  {acc.isDefault && (
                    <span className="badge" style={{ background: "var(--color-primary-muted)", color: "var(--color-primary)" }}>
                      Default
                    </span>
                  )}
                  {testResult[acc.id] === true && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-success)" }}>
                      <CheckCircle size={12} /> Connected
                    </span>
                  )}
                  {testResult[acc.id] === false && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-danger)" }}>
                      <XCircle size={12} /> Failed
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--color-text-muted)", fontSize: 13 }} className="truncate">
                  {acc.email} · {acc.host}:{acc.port}
                  {acc.tls && <span style={{ marginLeft: 6, color: "var(--color-success)", fontSize: 11 }}>🔒 TLS</span>}
                </p>
                <p style={{ color: "var(--color-text-dim)", fontSize: 12, marginTop: 2 }}>
                  {acc.emailsSent} emails sent
                </p>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button
                  onClick={() => handleTest(acc.id)}
                  disabled={testing === acc.id}
                  variant="secondary" size="sm"
                >
                  {testing === acc.id ? <Loader2 size={13} className="animate-spin mr-2" /> : <RefreshCw size={13} className="mr-2" />}
                  Test
                </Button>
                {!acc.isDefault && (
                  <Button onClick={() => handleSetDefault(acc.id)} variant="ghost" size="sm" title="Set as default">
                    <Star size={13} className="mr-2" /> Default
                  </Button>
                )}
                <Button onClick={() => setEditId(acc.id)} variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 size={13} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive" size="icon" className="h-8 w-8 rounded-md" />}>
                    <Trash2 size={13} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this SMTP account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the SMTP account from your database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(acc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add SMTP Account" maxWidth={520}>
        <SmtpForm actionFn={addSmtpAccount} onSuccess={() => {
          toast("success", "SMTP account added");
          setShowAdd(false);
          window.location.reload();
        }} submitLabel="Add Account" />
      </Modal>

      {accounts.map((acc) => (
        <Modal key={`edit-${acc.id}`} open={editId === acc.id} onClose={() => setEditId(null)} title="Edit SMTP Account" maxWidth={520}>
          <SmtpForm initial={acc} actionFn={updateSmtpAccount.bind(null, acc.id)} onSuccess={() => {
            toast("success", "Account updated");
            setEditId(null);
            window.location.reload();
          }} submitLabel="Save Changes" />
        </Modal>
      ))}
    </div>
  );
}
