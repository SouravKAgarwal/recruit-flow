"use server";

import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import nodemailer from "nodemailer";
import { z } from "zod";
import { rateLimit, enforceRateLimit } from "@/lib/rate-limit";
import type { SmtpAccount } from "@prisma/client";

/**
 * Fetches all SMTP accounts for the currently authenticated user.
 *
 * @returns An array of SMTP accounts sorted by creation date.
 */
export async function getSmtpAccounts(): Promise<SmtpAccount[]> {
  const { userId } = await requireAuth();
  return getCachedSmtpAccounts(userId);
}

async function getCachedSmtpAccounts(userId: string): Promise<SmtpAccount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("smtp", userId);

  return prisma.smtpAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export type SmtpActionState =
  | {
      success?: boolean;
      error?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

const smtpSchema = z.object({
  label: z.string().min(1, "Label is required"),
  senderName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().min(1, "Port is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  tls: z.preprocess((val) => val === "true" || val === true, z.boolean()),
});

/**
 * Creates a new SMTP account.
 * Rate limited to prevent abuse.
 *
 * @param prevState - Previous form state
 * @param formData - SMTP account details payload
 * @returns Success or error details
 */
export async function addSmtpAccount(
  prevState: SmtpActionState,
  formData: FormData,
): Promise<SmtpActionState> {
  try {
    await enforceRateLimit("add_smtp");
  } catch (err: any) {
    return { error: err.message };
  }

  const { userId } = await requireAuth();

  const parsed = smtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { label, senderName, email, host, port, username, password, tls } =
    parsed.data;

  if (!password) {
    return { errors: { password: ["Password is required for a new account"] } };
  }

  try {
    await prisma.smtpAccount.create({
      data: {
        userId,
        label,
        senderName: senderName ?? "",
        email,
        host,
        port,
        username,
        encryptedPassword: password,
        tls,
      },
    });

    revalidatePath("/smtp");
    revalidateTag("smtp", "hours");
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || "Failed to create SMTP account" };
  }
}

/**
 * Updates an existing SMTP account.
 *
 * @param id - The SMTP account ID to update
 * @param prevState - Previous form state
 * @param formData - Updated SMTP account details
 * @returns Success or error details
 */
export async function updateSmtpAccount(
  id: string,
  prevState: SmtpActionState,
  formData: FormData,
): Promise<SmtpActionState> {
  try {
    await enforceRateLimit("update_smtp");
  } catch (err: any) {
    return { error: err.message };
  }
  const { userId } = await requireAuth();

  const parsed = smtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { label, senderName, email, host, port, username, password, tls } =
    parsed.data;

  try {
    const account = await prisma.smtpAccount.findFirst({
      where: { id, userId },
    });
    if (!account) return { error: "Account not found." };

    await prisma.smtpAccount.update({
      where: { id },
      data: {
        label,
        senderName: senderName ?? "",
        email,
        host,
        port,
        username,
        encryptedPassword: password ? password : account.encryptedPassword,
        tls,
      },
    });

    revalidatePath("/smtp");
    revalidateTag("smtp", "hours");
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || "Failed to update SMTP account" };
  }
}

/**
 * Deletes an SMTP account by ID.
 *
 * @param id - The SMTP account ID to delete
 */
export async function deleteSmtpAccount(id: string) {
  await enforceRateLimit("delete_smtp");
  const { userId } = await requireAuth();
  await prisma.smtpAccount.deleteMany({ where: { id, userId } });
  revalidatePath("/smtp");
  revalidateTag("smtp", "hours");
}

export async function setDefaultSmtp(id: string) {
  await enforceRateLimit("set_default_smtp");
  const { userId } = await requireAuth();
  await prisma.smtpAccount.updateMany({
    where: { userId },
    data: { isDefault: false },
  });
  await prisma.smtpAccount.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/smtp");
  revalidateTag("smtp", "hours");
}

/**
 * Tests an SMTP connection by attempting to verify the transport.
 * Rate limited to prevent SMTP relay scanning or abuse.
 *
 * @param id - The SMTP account ID to test
 * @returns Verification result
 */
export async function testSmtpConnection(id: string) {
  try {
    await enforceRateLimit("test_smtp");
  } catch (err: any) {
    return { error: err.message };
  }

  const { userId } = await requireAuth();
  const account = await prisma.smtpAccount.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found." };

  try {
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.port === 465,
      auth: { user: account.username, pass: account.encryptedPassword },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    transporter.close();
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message ?? "Connection failed." };
  }
}
