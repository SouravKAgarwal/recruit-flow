"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { headers } from "next/headers";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import {
  enforceRateLimit,
  rateLimit,
} from "@/lib/rate-limit";

export type AuthState =
  | {
      error?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Please enter a valid email address."),
  avatar: z.string().url("Invalid avatar URL.").optional().or(z.literal("")),
});

const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required."),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128, "Password must be at most 128 characters."),
});

/**
 * Updates the authenticated user's profile details (name, email, avatar).
 * Password changes are handled separately via `updatePassword` to force
 * explicit current-password confirmation.
 *
 * Rate limited: 5 requests / 10 s per IP.
 */
export async function updateUser(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  // Rate limit keyed by action name; IP is resolved inside enforceRateLimit
  await enforceRateLimit("update-user");

  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const data = Object.fromEntries(formData);
  const result = updateProfileSchema.safeParse(data);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { name, email: rawEmail, avatar } = result.data;
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
      updateData.image = avatar;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return { error: undefined }; // success
  } catch (error) {
    console.error("[updateUser]", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Changes the authenticated user's password via Better Auth's API so that:
 *  1. The current password is verified before the change
 *  2. Better Auth's `revokeSessionsOnPasswordReset` logic fires correctly
 *  3. The password hash is managed by Better Auth (not a separate bcrypt call)
 *
 * Rate limited: 5 requests / 10 s per IP.
 */
export async function updatePassword(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await enforceRateLimit("update-password");

  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const data = Object.fromEntries(formData);
  const result = updatePasswordSchema.safeParse(data);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { currentPassword, newPassword } = result.data;

  try {
    const reqHeaders = await headers();

    // Use Better Auth's changePassword endpoint so it handles:
    // - Current password verification
    // - Hashing with the configured algorithm
    // - Session revocation (revokeSessionsOnPasswordReset: true)
    const response = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: reqHeaders,
    });

    if (!response) {
      return { error: "Failed to change password. Please check your current password." };
    }

    return { error: undefined }; // success
  } catch (error: unknown) {
    console.error("[updatePassword]", error);
    // Better Auth throws structured errors; surface a safe message
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("INVALID_PASSWORD") || msg.includes("invalid_password")) {
        return { error: "Current password is incorrect." };
      }
    }
    return { error: "Failed to change password. Please try again." };
  }
}

/**
 * Returns all active sessions for the current user from Redis.
 * Used in the account settings page to show and revoke sessions.
 */
export async function getActiveSessions() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }
  return getCachedActiveSessions(session.user.id);
}

async function getCachedActiveSessions(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("active-sessions");

  const listRaw = await redis.get<string>(`active-sessions-${userId}`);
  if (!listRaw) return [];

  const list: Array<{ token: string; expiresAt: number }> =
    typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;

  const now = Date.now();
  const sessions: unknown[] = [];

  for (const { token, expiresAt } of list) {
    if (expiresAt <= now) continue;

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

  return (sessions as Array<{ updatedAt?: Date; createdAt?: Date }>).sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
  );
}

/**
 * Revokes a specific session.
 * Validates that the session belongs to the current user before deleting it.
 */
export async function revokeSession(sessionToken: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }

  const listRaw = await redis.get<string>(`active-sessions-${session.user.id}`);
  if (!listRaw) throw new Error("Session not found.");

  const list: Array<{ token: string; expiresAt: number }> =
    typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;

  const belongs = list.some((s) => s.token === sessionToken);
  if (!belongs) throw new Error("Session not found or unauthorized.");

  // Remove from list
  const updated = list.filter((s) => s.token !== sessionToken);
  if (updated.length === 0) {
    await redis.del(`active-sessions-${session.user.id}`);
  } else {
    await redis.set(
      `active-sessions-${session.user.id}`,
      JSON.stringify(updated),
    );
  }

  // Delete the session token key itself
  await redis.del(sessionToken);

  revalidateTag("active-sessions", "minutes");

  return { success: true };
}

/**
 * Deletes the current user's account.
 *
 * Before deleting the DB record we:
 *  1. Revoke all active sessions in Redis (so they can't be replayed)
 *  2. Use Better Auth's deleteUser API (which handles cascade cleanup)
 *
 * Rate limited: 1 request / 10 s per IP to prevent abuse.
 */
export async function deleteAccount() {
  await enforceRateLimit("delete-account");

  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }

  const reqHeaders = await headers();

  try {
    // Revoke all Redis sessions for this user first
    const listRaw = await redis.get<string>(
      `active-sessions-${session.user.id}`,
    );
    if (listRaw) {
      const list: Array<{ token: string; expiresAt: number }> =
        typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;

      await Promise.all([
        ...list.map((s) => redis.del(s.token)),
        redis.del(`active-sessions-${session.user.id}`),
      ]);
    }

    // Delete user via Better Auth API (handles account / session cascade).
    // body fields (callbackURL, password, token) are all optional.
    await auth.api.deleteUser({
      headers: reqHeaders,
      body: {},
    });

    revalidateTag("active-sessions", "minutes");
    revalidateTag("user-stats", "minutes");
    revalidateTag("connected-accounts", "minutes");

    return { success: true };
  } catch (error) {
    console.error("[deleteAccount]", error);
    throw new Error("Failed to delete account. Please try again.");
  }
}

/**
 * Returns connected OAuth / credential accounts for the current user.
 */
export async function getConnectedAccounts() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return getCachedConnectedAccounts(session.user.id);
}

async function getCachedConnectedAccounts(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("connected-accounts");

  const accounts = await prisma.account.findMany({
    where: { userId },
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
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return getCachedUserStats(session.user.id);
}

async function getCachedUserStats(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("user-stats");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, emailsSentThisMonth] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    }),
    prisma.emailLog.count({
      where: { userId, sentAt: { gte: startOfMonth } },
    }),
  ]);

  return {
    createdAt: user?.createdAt ?? null,
    emailVerified: user?.emailVerified ?? false,
    emailsSentThisMonth,
  };
}
