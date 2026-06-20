import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
          <LoginForm />
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
