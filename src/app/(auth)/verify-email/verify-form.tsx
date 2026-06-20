"use client";

import { useActionState, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type VerifyState = {
  error: string | null;
  step: "request" | "verify";
  email: string;
};

export function VerifyEmailForm({ initialEmail }: { initialEmail: string }) {
  const { toast } = useToast();
  const router = useRouter();

  const [otpValue, setOtpValue] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prevState: VerifyState, formData: FormData): Promise<VerifyState> => {
      const action = formData.get("action") as string;
      const email = (formData.get("email") as string) || prevState.email;

      if (action === "request") {
        if (!email) return { ...prevState, error: "Email is required." };
        try {
          const { error } = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });
          if (error) {
            return { error: error.message || "Failed to send code.", step: "request", email };
          }
          toast("success", "OTP Sent", "Check your email for the verification code.");
          setOtpValue("");
          return { error: null, step: "verify", email };
        } catch (err) {
          return { error: "Something went wrong.", step: "request", email };
        }
      }

      if (action === "verify") {
        const otp = formData.get("otp") as string;
        if (!otp || otp.length !== 6) return { ...prevState, error: "Please enter the 6-digit code." };
        
        try {
          const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
          if (error) {
            return { error: error.message || "Invalid or expired OTP.", step: "verify", email };
          }
          toast("success", "Success", "Email verified! You can now log in.");
          router.push("/login");
          return { error: null, step: "verify", email };
        } catch (err) {
          return { error: "Something went wrong.", step: "verify", email };
        }
      }

      return prevState;
    },
    { error: null, step: initialEmail ? "verify" : "request", email: initialEmail }
  );

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Verify Email
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm your email address to activate your account.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-4">
            {state.error && (
              <div className="bg-destructive/10 border border-destructive/25 rounded-md px-3.5 py-2.5 text-destructive text-sm">
                {state.error}
              </div>
            )}

            {state.step === "request" ? (
              <>
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Enter your email to receive a verification code.
                </p>
                <input type="hidden" name="action" value="request" />
                <Input
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  defaultValue={state.email}
                  required
                />
                <Button type="submit" className="w-full mt-2" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    "Send OTP Code"
                  )}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  We sent a verification code to <strong>{state.email}</strong>
                </p>
                <input type="hidden" name="action" value="verify" />
                <input type="hidden" name="email" value={state.email} />
                
                <InputOTP
                  maxLength={6}
                  name="otp"
                  value={otpValue}
                  onChange={setOtpValue}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={otpValue.length !== 6 || isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
                
                <div className="text-center mt-2">
                  <button
                    type="submit"
                    name="action"
                    value="request"
                    className="text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
