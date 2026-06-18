"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

export type AuthState = {
  error?: string;
  errors?: Record<string, string[]>;
} | undefined;

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { name, email: rawEmail, password } = result.data;
  const email = rawEmail.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    await session.save();
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { email: rawEmail, password } = result.data;
  const email = rawEmail.toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "Invalid email or password." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid email or password." };
    }

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    await session.save();
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().optional(),
  avatar: z.string().optional(),
});

export async function updateUser(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session.userId) {
    return { error: "Not authenticated" };
  }

  const data = Object.fromEntries(formData);
  const result = updateSchema.safeParse(data);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { name, email: rawEmail, password, avatar } = result.data;
  const email = rawEmail.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.userId) {
      return { error: "An account with this email already exists." };
    }

    const updateData: any = { name, email };
    if (password && password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    } else if (password && password.length > 0 && password.length < 8) {
      return { errors: { password: ["Password must be at least 8 characters."] } };
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    session.email = user.email;
    session.name = user.name;
    await session.save();
    
    return { error: undefined }; // success
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
