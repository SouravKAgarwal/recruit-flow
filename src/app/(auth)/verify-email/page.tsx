import { redirect } from "next/navigation";
import { basePrisma } from "@/lib/prisma";
import { VerifyEmailForm } from "./verify-form";
import { Suspense } from "react";

async function VerifyEmail({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  if (!email) {
    redirect("/login");
  }

  const user = await basePrisma.user.findUnique({
    where: { email },
  });

  if (!user || user.emailVerified) {
    redirect("/login");
  }

  return <VerifyEmailForm initialEmail={email} />;
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense>
      <VerifyEmail searchParams={searchParams} />
    </Suspense>
  );
}
