import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import { ResetPasswordForm } from "./reset-form";
import { Suspense } from "react";

async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  if (!email) {
    redirect("/forgot-password");
  }

  // Ensure there is actually a pending OTP request for this email!
  const key = `verification:forget-password-otp-${email}`;
  const data = await redis.get(key);

  if (!data) {
    // No OTP was requested, or it expired.
    redirect("/forgot-password");
  }

  return <ResetPasswordForm initialEmail={email} />;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense>
      <ResetPassword searchParams={searchParams} />
    </Suspense>
  );
}
