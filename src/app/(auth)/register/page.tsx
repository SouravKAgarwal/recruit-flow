import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start sending smarter cold emails today
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RegisterForm />
        </CardContent>
      </Card>

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
