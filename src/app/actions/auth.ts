"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

export type AuthState =
  | {
      error?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().optional(),
  avatar: z.string().optional(),
});

/**
 * Updates the authenticated user's profile details including name, email, avatar, or password.
 * Rate limited to prevent abuse.
 *
 * @param prevState - The previous state from useActionState
 * @param formData - Form payload containing name, email, and optionally password/avatar
 * @returns Success state (error: undefined) or validation/system errors
 */
export async function updateUser(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for") || "127.0.0.1";

  const { success } = await rateLimit.limit(`update_user_${ip}`);
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const session = await getSession();
  if (!session?.user?.id) {
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
    if (existing && existing.id !== session.user.id) {
      return { error: "An account with this email already exists." };
    }

    const updateData: { name: string; email: string; image?: string } = {
      name,
      email,
    };

    if (avatar) {
      updateData.image = avatar; // Better Auth uses image for avatar
    }

    if (password && password.length >= 8) {
      const hashed = await bcrypt.hash(password, 12);
      await prisma.account.updateMany({
        where: { userId: session.user.id, providerId: "credential" },
        data: { password: hashed },
      });
    } else if (password && password.length > 0 && password.length < 8) {
      return {
        errors: { password: ["Password must be at least 8 characters."] },
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // We updated the database, but Better Auth session requires explicit update if we changed email/name.
    // Assuming client side re-fetches session.

    return { error: undefined }; // success
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
