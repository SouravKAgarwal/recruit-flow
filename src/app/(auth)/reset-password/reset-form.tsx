"use client";

import { useActionState, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { verifyResetOtpServer } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type ResetState = {
  error: string | null;
  step: "verify" | "reset";
  otp: string;
};

export function ResetPasswordForm({ initialEmail }: { initialEmail: string }) {
  const { toast } = useToast();
  const router = useRouter();

  const [otpValue, setOtpValue] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prevState: ResetState, formData: FormData): Promise<ResetState> => {
      const action = formData.get("action") as string;
      const otp = (formData.get("otp") as string) || prevState.otp;
      const email = formData.get("email") as string;

      if (action === "verify") {
        if (!otp || otp.length !== 6) {
          return { error: "Please enter a valid 6-digit code.", step: "verify", otp };
        }
        
        const isValid = await verifyResetOtpServer(email, otp);
        if (!isValid) {
          return { error: "Invalid or expired reset code.", step: "verify", otp };
        }

        return { error: null, step: "reset", otp };
      }

      if (action === "reset") {
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (!password || password !== confirmPassword) {
          return { error: "Please ensure passwords match.", step: "reset", otp };
        }

        try {
          const { error } = await authClient.emailOtp.resetPassword({
            email,
            otp,
            password,
          });

          if (error) {
            return { error: error.message || "Failed to reset password. The code may be invalid.", step: "verify", otp };
          }

          toast(
            "success",
            "Success",
            "Password reset successfully. You can now log in.",
          );
          router.push("/login");
          return { error: null, step: "reset", otp };
        } catch (err) {
          return { error: "Something went wrong. Please try again.", step: "reset", otp };
        }
      }

      return prevState;
    },
    { error: null, step: "verify", otp: "" }
  );

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Set New Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the code sent to your email, then choose a new password.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-4">
            <Input name="email" type="hidden" defaultValue={initialEmail} />

            {state.error && (
              <div className="bg-destructive/10 border border-destructive/25 rounded-md px-3.5 py-2.5 text-destructive text-sm">
                {state.error}
              </div>
            )}

            {state.step === "verify" ? (
              <div className="flex flex-col items-center gap-4">
                <input type="hidden" name="action" value="verify" />
                <Label htmlFor="otp">Reset Code (OTP)</Label>
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
                    "Next"
                  )}
                </Button>
              </div>
            ) : (
              <>
                <input type="hidden" name="action" value="reset" />
                <input type="hidden" name="otp" value={state.otp} />

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                    </>
                  ) : (
                    "Save New Password"
                  )}
                </Button>
                
                <div className="text-center mt-2">
                   <button
                    type="submit"
                    name="action"
                    value="back_to_verify"
                    className="text-xs text-primary hover:underline"
                    formNoValidate
                    onClick={(e) => {
                       e.preventDefault();
                       window.location.reload();
                    }}
                  >
                    Enter a different code
                  </button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
