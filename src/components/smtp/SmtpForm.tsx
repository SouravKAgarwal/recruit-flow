"use client";

import { useActionState, useEffect, useState } from "react";
import type { SmtpActionState } from "@/app/actions/smtp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { SmtpAccount } from "@prisma/client";

const PROVIDER_PRESETS = [
  { name: "Gmail", host: "smtp.gmail.com", port: 587, tls: true },
  { name: "Outlook", host: "smtp.office365.com", port: 587, tls: true },
  { name: "Zoho", host: "smtp.zoho.com", port: 587, tls: true },
  { name: "Custom", host: "", port: 587, tls: true },
];

export function SmtpForm({
  initial,
  actionFn,
  submitLabel,
  onSuccess,
}: {
  initial?:SmtpAccount;
  actionFn: (
    prevState: SmtpActionState,
    formData: FormData,
  ) => Promise<SmtpActionState>;
  submitLabel: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<SmtpActionState, FormData>(
    actionFn,
    undefined,
  );
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
    <form
      action={action}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {state?.error && (
        <div
          style={{
            background: "var(--color-danger-muted)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            color: "var(--color-danger)",
            fontSize: 13.5,
          }}
        >
          {state.error}
        </div>
      )}

      {/* Provider presets */}
      <div>
        <Label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Provider
        </Label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PROVIDER_PRESETS.map((p) => (
            <Button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p.name)}
              variant={preset === p.name ? "default" : "secondary"}
              size="sm"
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="label">Account label *</Label>
          <Input
            id="label"
            name="label"
            required
            defaultValue={initial?.label}
            placeholder="Gmail - Work"
            aria-invalid={!!state?.errors?.label}
          />
          {state?.errors?.label && (
            <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
              {state.errors.label[0]}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="senderName">Sender name</Label>
          <Input
            id="senderName"
            name="senderName"
            defaultValue={initial?.senderName}
            placeholder="Alex Johnson"
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor="email">Email address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={initial?.email}
          placeholder="you@gmail.com"
          aria-invalid={!!state?.errors?.email}
        />
        {state?.errors?.email && (
          <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
            {state.errors.email[0]}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="host">SMTP host *</Label>
          <Input
            id="host"
            name="host"
            required
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.gmail.com"
            aria-invalid={!!state?.errors?.host}
          />
          {state?.errors?.host && (
            <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
              {state.errors.host[0]}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            name="port"
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            aria-invalid={!!state?.errors?.port}
          />
          {state?.errors?.port && (
            <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
              {state.errors.port[0]}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          name="username"
          required
          defaultValue={initial?.username}
          placeholder="you@gmail.com"
          aria-invalid={!!state?.errors?.username}
        />
        {state?.errors?.username && (
          <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
            {state.errors.username[0]}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor="password">Password / App password *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required={!initial}
          placeholder={initial ? "Leave blank to keep existing" : "••••••••"}
          aria-invalid={!!state?.errors?.password}
        />
        {state?.errors?.password && (
          <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
            {state.errors.password[0]}
          </span>
        )}
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 13.5,
        }}
      >
        <input type="hidden" name="tls" value={tls ? "true" : "false"} />
        <div
          onClick={() => setTls(!tls)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: tls
              ? "var(--color-primary)"
              : "var(--color-border-strong)",
            position: "relative",
            cursor: "pointer",
            transition: "background 200ms",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--color-surface)",
              position: "absolute",
              top: 3,
              left: tls ? 18 : 3,
              transition: "left 200ms",
            }}
          />
        </div>
        <span style={{ color: "var(--color-text-muted)" }}>Enable TLS/SSL</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full mt-4">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" /> Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
