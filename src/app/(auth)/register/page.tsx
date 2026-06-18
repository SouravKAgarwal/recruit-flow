import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="animate-fade-in" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 6,
            }}
          >
            Create your account
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            Start sending smarter cold emails today
          </p>
        </div>

        <Card>
          <CardContent style={{ paddingTop: 24 }}>
            <RegisterForm />
          </CardContent>
        </Card>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "var(--color-text-muted)",
            fontSize: 13.5,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--color-primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
