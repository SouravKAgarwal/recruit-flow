"use client";

import { useActionState } from "react";
import { register, type AuthState } from "@/app/actions/auth";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    register,
    undefined,
  );

  return (
    <form
      action={action}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Label htmlFor="name">Full name</Label>
        <div style={{ position: "relative" }}>
          <User
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Alex Johnson"
            style={{ paddingLeft: 36 }}
            aria-invalid={!!state?.errors?.name}
          />
        </div>
        {state?.errors?.name && (
          <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
            {state.errors.name[0]}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Label htmlFor="email">Email address</Label>
        <div style={{ position: "relative" }}>
          <Mail
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            style={{ paddingLeft: 36 }}
            aria-invalid={!!state?.errors?.email}
          />
        </div>
        {state?.errors?.email && (
          <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
            {state.errors.email[0]}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Label htmlFor="password">
          Password{" "}
          <span style={{ color: "var(--color-text-dim)", fontWeight: 400 }}>
            (min 8 chars)
          </span>
        </Label>
        <div style={{ position: "relative" }}>
          <Lock
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            minLength={8}
            style={{ paddingLeft: 36 }}
            aria-invalid={!!state?.errors?.password}
          />
        </div>
        {state?.errors?.password && (
          <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
            {state.errors.password[0]}
          </span>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full mt-2">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" /> Creating
            account…
          </>
        ) : (
          <>
            Get started <ArrowRight size={16} className="ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}
