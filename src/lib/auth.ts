import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { basePrisma } from "./base-prisma";
import { redis } from "./redis";
import { nextCookies } from "better-auth/next-js";
import {
  sendMail,
  verificationEmail,
  resetPasswordEmail,
  otpEmail,
} from "./email-templates";

// ---------------------------------------------------------------------------
// Environment guards
// ---------------------------------------------------------------------------
const isProd = process.env.NODE_ENV === "production";

if (
  !process.env.BETTER_AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET.length < 32
) {
  throw new Error(
    "[auth] BETTER_AUTH_SECRET is missing or too short. Set a random 64-char hex string.",
  );
}

// ---------------------------------------------------------------------------
// Better Auth instance
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  /** Display name shown in authenticator apps (2FA issuer) and email copy. */
  appName: "RecruitsFlow",

  // -------------------------------------------------------------------------
  // Database adapter — Prisma + PostgreSQL
  // -------------------------------------------------------------------------
  database: prismaAdapter(basePrisma, { provider: "postgresql" }),

  // -------------------------------------------------------------------------
  // Secondary storage — Redis (Upstash)
  // Stores sessions and OTP/verification tokens in Redis so they survive server
  // restarts and are accessible across edge/serverless instances without hitting
  // the primary DB on every request.
  // -------------------------------------------------------------------------
  secondaryStorage: {
    get: async (key) => {
      const value = await redis.get<unknown>(key);
      if (value === null || value === undefined) return null;
      return typeof value === "string" ? value : JSON.stringify(value);
    },
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, { ex: ttl });
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },

  // -------------------------------------------------------------------------
  // Social / OAuth providers
  // -------------------------------------------------------------------------
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      /**
       * `"consent"` always shows the OAuth consent screen so the user can
       * review scopes even when they've previously authorised the app.
       */
      prompt: "consent",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      /**
       * `offline` access type requests a refresh token so we can refresh
       * the Google access token without prompting the user again.
       * `select_account consent` forces account picker + scope review.
       */
      accessType: "offline",
      prompt: "select_account consent",
    },
  },

  // -------------------------------------------------------------------------
  // Account Management
  // -------------------------------------------------------------------------
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
    /**
     * Use "cookie" strategy for the OAuth PKCE state to avoid an extra DB
     * round-trip during the callback.
     */
    storeStateStrategy: "cookie",

    /**
     * Do NOT store OAuth access/refresh tokens in a browser cookie.
     * Even encrypted, token material in a cookie is accessible to any server-
     * side code that can read cookies and is sent on every request.
     * Tokens are stored securely in the database via the Prisma adapter.
     */
    storeAccountCookie: false,

    /**
     * Encrypt OAuth tokens at rest in the database so a DB leak doesn't
     * immediately expose live OAuth tokens.
     */
    encryptOAuthTokens: true,
  },

  // -------------------------------------------------------------------------
  // Email + password authentication
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,

    /**
     * Do NOT auto-sign-in after sign-up.  The user must verify their email
     * first.  This prevents unverified accounts from accessing the app.
     */
    autoSignIn: false,

    /**
     * Block sign-in until the user's email has been verified.
     * Better Auth returns 403 EMAIL_NOT_VERIFIED for unverified attempts.
     */
    requireEmailVerification: true,

    /**
     * 12 characters minimum (NIST SP 800-63B recommends ≥ 8; we use 12 for
     * stronger resistance to dictionary attacks against the bcrypt hash).
     */
    minPasswordLength: 12,

    /**
     * Cap at 128 chars to prevent algorithmic complexity attacks against the
     * password hashing function (bcrypt / scrypt have work-factor limits).
     */
    maxPasswordLength: 128,

    /**
     * Password-reset token lifetime: 1 hour.
     */
    resetPasswordTokenExpiresIn: 3600,

    /**
     * Triggered when the user requests a password-reset link.
     */
    async sendResetPassword({ user, url }) {
      await sendMail(
        user.email,
        "Reset your password – RecruitsFlow",
        resetPasswordEmail(url),
      );
    },

    /**
     * Invalidate all other sessions when the user resets their password so
     * a stolen session cannot survive a password change.
     */
    revokeSessionsOnPasswordReset: true,
  },

  // -------------------------------------------------------------------------
  // Email verification
  // -------------------------------------------------------------------------
  emailVerification: {
    /**
     * Send a verification email on every sign-up automatically.
     */
    sendOnSignUp: true,

    /**
     * Re-send a verification link when an unverified user tries to sign in
     * so they have a path forward instead of just seeing an error.
     */
    sendOnSignIn: true,

    /**
     * Do NOT automatically create a session when the user clicks the
     * verification link.  Requiring an explicit sign-in after verification
     * is a safer pattern: it prevents a stolen verification email from
     * silently granting access.  The user is redirected to /login instead.
     */
    autoSignInAfterVerification: false,

    /**
     * Verification token lifetime: 24 hours — enough time to check an inbox
     * on a slow connection without leaving stale tokens around for days.
     */
    expiresIn: 86400,

    async sendVerificationEmail({ user, url }) {
      await sendMail(
        user.email,
        "Verify your email address – RecruitsFlow",
        verificationEmail(url),
      );
    },
  },

  // -------------------------------------------------------------------------
  // Plugins
  // -------------------------------------------------------------------------
  plugins: [
    /**
     * emailOTP — enables one-time password email verification.
     * 6-digit OTP, 10-minute window.
     */
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes

      async sendVerificationOTP({ email, otp, type }) {
        const { subject, html } = otpEmail({ otp, type });
        await sendMail(email, subject, html);
      },
    }),

    /**
     * nextCookies — patches the cookie setter so cookies set inside
     * Next.js Server Actions / Route Handlers are correctly applied in the
     * same request/response cycle (required for better-auth + Next.js App Router).
     */
    nextCookies(),
  ],

  // -------------------------------------------------------------------------
  // Session configuration
  // -------------------------------------------------------------------------
  session: {
    /**
     * Sessions expire after 7 days of total inactivity.
     * Reduced from 24h rolling to 7 days absolute so users aren't signed out
     * after a single idle day.
     */
    expiresIn: 60 * 60 * 24 * 7, // 7 days

    /**
     * Rolling expiry window: refresh the session TTL at most once per 30
     * minutes.  Reduces Redis write load from 288×/day (5-min window) to
     * 48×/day while still keeping active sessions alive.
     */
    updateAge: 60 * 30, // 30 minutes

    /**
     * Cookie cache — stores a signed JWT copy of the session in the browser
     * so most page navigations don't hit Redis at all.
     * Invalidation (sign-out, revoke) takes effect within maxAge (5 min).
     */
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "jwt",
    },
  },

  // -------------------------------------------------------------------------
  // Advanced / security settings
  // -------------------------------------------------------------------------
  advanced: {
    /**
     * `rf` prefix keeps cookie names short and non-identifiable.
     * Cookies will be named rf.session_token, rf.session_data, etc.
     * In production the __Secure- prefix is prepended automatically via
     * useSecureCookies.
     */
    cookiePrefix: "rf",

    /**
     * Only set the Secure attribute in production (HTTPS).
     * On localhost (HTTP) the Secure flag causes browsers to silently drop
     * the cookie, which breaks the entire auth flow.
     */
    useSecureCookies: isProd,

    /**
     * Explicit default attributes applied to every auth cookie.
     * - httpOnly: prevent JavaScript access (XSS mitigation)
     * - sameSite: "lax" — cookies sent on same-site and top-level navigations,
     *   but not on cross-site subresource requests (CSRF mitigation)
     * - secure: only transmit over HTTPS in production
     */
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProd,
    },

    /**
     * Enforce CSRF protection on all state-mutating requests.
     * This is Better Auth's default; we set it explicitly so it's clear.
     */
    disableCSRFCheck: false,
  },
});
