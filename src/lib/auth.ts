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
// Better Auth instance
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  /** Display name shown in authenticator apps (2FA issuer) and email copy. */
  appName: "RecruitsFlow",

  // -------------------------------------------------------------------------
  // Database adapter — Prisma + PostgreSQL + Redis Custom Override
  // -------------------------------------------------------------------------
  database: prismaAdapter(basePrisma, { provider: "postgresql" }),

  // -------------------------------------------------------------------------
  // Secondary storage — Redis
  // Stores sessions, rate-limit counters, and OTP/verification tokens so they
  // survive server restarts without hitting the primary DB on every request.
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
  },

  // -------------------------------------------------------------------------
  // Email + password authentication
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,

    /**
     * Automatically sign the user in immediately after a successful sign-up.
     * Set to `false` if you want users to verify their email before accessing
     * the app (pair with `requireEmailVerification: true`).
     */
    autoSignIn: false,

    /**
     * Block sign-in until the user's email address has been verified.
     * Better Auth returns a 403 with `EMAIL_NOT_VERIFIED` when this is `true`
     * and the user's `emailVerified` flag is still `false`.
     */
    requireEmailVerification: true,

    /** Enforce a minimum password length of 8 characters (Better Auth default). */
    minPasswordLength: 8,

    /**
     * Cap passwords at 128 characters to prevent algorithmic complexity
     * attacks against the password hashing function (bcrypt / scrypt).
     */
    maxPasswordLength: 128,

    /**
     * Password-reset token lifetime in seconds.
     * Default: 3 600 s (1 hour). Setting it explicitly makes the intent clear.
     */
    resetPasswordTokenExpiresIn: 3600, // 1 hour

    /**
     * Triggered when the user requests a password-reset link.
     *
     * Better Auth passes `{ user, url, token }` — `url` is the complete
     * ready-to-use reset link; `token` is available if you need to build a
     * custom URL.
     */
    async sendResetPassword({ user, url }) {
      await sendMail(
        user.email,
        "Reset your password – RecruitsFlow",
        resetPasswordEmail(url),
      );
    },

    revokeSessionsOnPasswordReset: true,
  },

  // -------------------------------------------------------------------------
  // Email verification (top-level key — separate from emailAndPassword)
  // -------------------------------------------------------------------------
  emailVerification: {
    /**
     * Sends the verification email after every sign-up automatically.
     * Better Auth calls this with `{ user, url, token }`.
     */
    sendOnSignUp: true,

    /**
     * Re-send a verification link when an unverified user tries to sign in.
     * Keeps the flow smooth: unverified users get a helpful email instead of
     * just an error message.
     */
    sendOnSignIn: true,

    /**
     * Once the user clicks the verification link, automatically create a
     * session for them so they land straight in the app.
     */
    autoSignInAfterVerification: true,

    /** Verification token lifetime in seconds (default: 3 600 s / 1 hour). */
    expiresIn: 86400, // 24 hours — gives users enough time to check their inbox

    /**
     * Triggered by Better Auth whenever a verification email needs to be sent.
     * Receives `{ user, url, token }`.
     */
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
     * emailOTP — enables one-time password sign-in / email verification
     * without requiring the user to set a password.
     */
    emailOTP({
      /**
       * OTP expiry in seconds.  10 minutes is a sensible default — short
       * enough to be secure, long enough for users on slow connections.
       */
      otpLength: 6,
      expiresIn: 600, // 10 minutes

      async sendVerificationOTP({ email, otp, type }) {
        const { subject, html } = otpEmail({ otp, type });
        await sendMail(email, subject, html);
      },
    }),

    /**
     * nextCookies — patches the cookie setter so cookies set inside
     * Next.js Server Actions / Route Handlers are correctly applied
     * in the same request/response cycle.
     */
    nextCookies(),
  ],

  // -------------------------------------------------------------------------
  // Session configuration
  // -------------------------------------------------------------------------
  session: {
    /** Sessions expire after 7 days of inactivity. */
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds

    /**
     * Rolling expiry: the session TTL is refreshed whenever the user makes
     * a request, as long as more than `updateAge` seconds have elapsed since
     * the last refresh.  Prevents active users from being unexpectedly signed
     * out while keeping idle sessions from living forever.
     */
    updateAge: 60 * 60 * 24, // refresh window: 1 day

    /**
     * Cookie cache reduces Redis round-trips on every request.
     * The session is cached client-side in a signed cookie for up to 5 minutes.
     * Any server-side invalidation (e.g. sign-out, revocation) still takes
     * effect at the next request after the cache has expired.
     */
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // -------------------------------------------------------------------------
  // Advanced / security settings
  // -------------------------------------------------------------------------
  // advanced: {
  //   defaultCookieAttributes: {
  //     /**
  //      * Mark all auth cookies as Secure so they are only transmitted over
  //      * HTTPS.  In local development this will break if you're on plain HTTP —
  //      * set `BETTER_AUTH_DISABLE_SECURE_COOKIES=true` in your `.env.local`.
  //      */
  //     secure: process.env.NODE_ENV === "production",
  //     sameSite: "strict",
  //     prefix: "secure",
  //   },
  // },
});
