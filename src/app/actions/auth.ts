"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { headers } from "next/headers";
import { enforceRateLimit } from "@/lib/rate-limit";

export type AuthState =
  | {
      error?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

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

  await enforceRateLimit(`update_user_${ip}`);

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

export async function getActiveSessions() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Better Auth stores: active-sessions-{userId} = JSON string of [{token, expiresAt}, ...]
  // Each session token is its own key: {token} = JSON string of {session: {...}, user: {...}}
  const listRaw = await redis.get<string>(`active-sessions-${session.user.id}`);
  if (!listRaw) return [];

  const list: Array<{ token: string; expiresAt: number }> =
    typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;

  const now = Date.now();
  const sessions: any[] = [];

  for (const { token, expiresAt } of list) {
    if (expiresAt <= now) continue; // skip expired

    const data = await redis.get<string>(token);
    if (!data) continue;

    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (!parsed?.session) continue;

      const s = parsed.session;
      sessions.push({
        ...s,
        expiresAt: new Date(s.expiresAt),
        createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
      });
    } catch {
      continue;
    }
  }

  return sessions.sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt).getTime() -
      new Date(a.updatedAt ?? a.createdAt).getTime(),
  );
}

export async function revokeSession(sessionToken: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Better Auth stores active-sessions-{userId} as JSON array of {token, expiresAt}
  const listRaw = await redis.get<string>(`active-sessions-${session.user.id}`);
  if (!listRaw) throw new Error("Session not found");

  const list: Array<{ token: string; expiresAt: number }> =
    typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;

  const belongs = list.some((s) => s.token === sessionToken);
  if (!belongs) throw new Error("Session not found or unauthorized");

  // Remove from list and update
  const updated = list.filter((s) => s.token !== sessionToken);
  if (updated.length === 0) {
    await redis.del(`active-sessions-${session.user.id}`);
  } else {
    await redis.set(
      `active-sessions-${session.user.id}`,
      JSON.stringify(updated),
    );
  }

  // Delete the token key itself
  await redis.del(sessionToken);

  return { success: true };
}


export async function deleteAccount() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    // Delete user from DB (cascade should handle related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw new Error("Failed to delete account");
  }
}

/**
 * Returns connected OAuth / credential accounts for the current user.
 * Maps Better Auth's providerId values to human-readable labels.
 */
export async function getConnectedAccounts() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { providerId: true, createdAt: true, accountId: true },
  });

  return accounts.map((a) => ({
    providerId: a.providerId,
    accountId: a.accountId,
    connectedAt: a.createdAt,
  }));
}

/**
 * Returns real stats and profile info for the current user's Account tab.
 */
export async function getUserStats() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const userId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, emailsSentThisMonth, totalRecruiters, totalCampaigns, totalTemplates] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, email: true, name: true, emailVerified: true },
      }),
      prisma.emailLog.count({
        where: { userId, sentAt: { gte: startOfMonth } },
      }),
      prisma.recruiter.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.emailTemplate.count({ where: { userId } }),
    ]);

  return {
    createdAt: user?.createdAt ?? null,
    emailVerified: user?.emailVerified ?? false,
    emailsSentThisMonth,
    totalRecruiters,
    totalCampaigns,
    totalTemplates,
  };
}
