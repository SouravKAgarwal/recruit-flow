import { headers } from "next/headers";
import { cache } from "react";

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  image?: string;
}

/**
 * Retrieves the current session using better-auth
 * Memoized per-request to avoid redundant DB/Redis lookups
 */
export const getSession = cache(async () => {
  // Move await headers() outside try-catch so Next.js can properly
  // catch its own DynamicServerError and opt the route into dynamic rendering.
  const reqHeaders = await headers();

  try {
    const { auth } = await import("./auth");
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session || !session.user || !session.session) {
      return null;
    }

    if (!session.session.token) return null;

    if (new Date(session.session.expiresAt) < new Date()) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("[Session Error]", error);
    return null;
  }
});

/**
 * Ensures a user is authenticated before proceeding.
 * Throws an error if no valid session is found. (Used in API/Actions)
 */
export const requireAuth = cache(async (): Promise<SessionData> => {
  const sessionData = await getSession();
  if (!sessionData?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return {
    userId: sessionData.user.id,
    email: sessionData.user.email,
    name: sessionData.user.name,
    image: sessionData.user.image || undefined,
  };
});