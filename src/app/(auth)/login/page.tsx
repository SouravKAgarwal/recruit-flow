import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your RecruitFlow AI account
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/*
           * Suspense is required here because LoginForm uses useSearchParams()
           * to read ?callbackUrl. Without a boundary Next.js cannot statically
           * pre-render this page (it blocks on the dynamic search param read).
           */}
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Don&rsquo;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-semibold hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
