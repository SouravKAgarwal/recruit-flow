import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

/**
 * Better Auth client — used in Client Components and browser-side code.
 *
 * Plugins:
 *  - `emailOTPClient`        — exposes `authClient.emailOtp.*` methods
 *  - `inferAdditionalFields` — infers custom user/session fields from the
 *                              server-side `auth` type so TypeScript knows
 *                              about them on the client without duplicating
 *                              field definitions.
 *
 * NOTE: `auth` is imported as a **type only** (`import type`) to ensure that
 * no server-side code (Prisma, Redis, nodemailer, …) is bundled into the
 * client JavaScript.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});

// Re-export the most commonly used hooks / methods for convenient named imports.
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
