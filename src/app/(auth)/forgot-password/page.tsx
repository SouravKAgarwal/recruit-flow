"use client";

import { useActionState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: { error: string | null; success: boolean; email: string }, formData: FormData) => {
      const email = formData.get("email") as string;
      if (!email) return { error: "Email is required.", success: false, email: "" };

      try {
        const { error } = await authClient.emailOtp.sendVerificationOtp({ 
          email,
          type: "forget-password"
        });
        
        if (error) {
          return { error: error.message || "Failed to send reset code.", success: false, email };
        }

        toast(
          "success",
          "Email Sent",
          "If an account exists, a reset code has been sent.",
        );
        
        return { error: null, success: true, email };
      } catch (err) {
        return { error: "Something went wrong. Please try again.", success: false, email };
      }
    },
    { error: null, success: false, email: "" }
  );

  useEffect(() => {
    if (state.success && state.email) {
      const timeout = setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(state.email)}`);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.success, state.email, router]);

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Forgot Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a reset code.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {state.success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-primary/10 text-primary rounded-lg text-sm font-medium animate-pulse">
                Redirecting to enter your reset code...
              </div>
              <Link
                href="/login"
                className="text-sm text-primary hover:underline block"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {state.error && (
                <div className="bg-destructive/10 border border-destructive/25 rounded-md px-3.5 py-2.5 text-destructive text-sm">
                  {state.error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  defaultValue={state.email}
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </Button>

              <div className="text-center text-sm mt-2">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
