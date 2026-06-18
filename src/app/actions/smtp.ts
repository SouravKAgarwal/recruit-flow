"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import nodemailer from "nodemailer";

function encrypt(text: string): string {
  // Simple reversible encoding – in production use KMS/AES
  return Buffer.from(text, "utf-8").toString("base64");
}

function decrypt(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export async function getSmtpAccounts() {
  const { userId } = await requireAuth();
  return prisma.smtpAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

import { z } from "zod";

export type SmtpActionState = {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
} | undefined;

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

export async function addSmtpAccount(prevState: SmtpActionState, formData: FormData): Promise<SmtpActionState> {
  const { userId } = await requireAuth();

  const parsed = smtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { label, senderName, email, host, port, username, password, tls } = parsed.data;

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
        encryptedPassword: encrypt(password),
        tls,
      },
    });

    revalidatePath("/smtp");
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || "Failed to create SMTP account" };
  }
}

export async function updateSmtpAccount(id: string, prevState: SmtpActionState, formData: FormData): Promise<SmtpActionState> {
  const { userId } = await requireAuth();

  const parsed = smtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { label, senderName, email, host, port, username, password, tls } = parsed.data;

  try {
    const account = await prisma.smtpAccount.findFirst({ where: { id, userId } });
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
        encryptedPassword: password ? encrypt(password) : account.encryptedPassword,
        tls,
      },
    });

    revalidatePath("/smtp");
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || "Failed to update SMTP account" };
  }
}

export async function deleteSmtpAccount(id: string) {
  const { userId } = await requireAuth();
  await prisma.smtpAccount.deleteMany({ where: { id, userId } });
  revalidatePath("/smtp");
}

export async function setDefaultSmtp(id: string) {
  const { userId } = await requireAuth();
  await prisma.smtpAccount.updateMany({ where: { userId }, data: { isDefault: false } });
  await prisma.smtpAccount.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/smtp");
}

export async function testSmtpConnection(id: string) {
  const { userId } = await requireAuth();
  const account = await prisma.smtpAccount.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found." };

  try {
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.port === 465,
      auth: { user: account.username, pass: decrypt(account.encryptedPassword) },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    transporter.close();
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message ?? "Connection failed." };
  }
}
