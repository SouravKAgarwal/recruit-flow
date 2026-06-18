import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "./login-form";

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            Sign in to your RecruitFlow AI account
          </p>
        </div>

        <Card>
          <CardContent style={{ paddingTop: 24 }}>
            <LoginForm />
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
          Don&rsquo;t have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--color-primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
