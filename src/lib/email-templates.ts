/**
 * email-templates.ts
 *
 * Centralised HTML email templates used by Better Auth's transactional emails
 * (verification, password reset) and the emailOTP plugin.
 *
 * All templates share the same outer shell (`buildEmail`) so branding changes
 * only need to happen in one place.
 */
import nodemailer from "nodemailer";

const APP_NAME = "RecruitsFlow";
const BRAND_COLOR = "#2563eb"; // primary blue
const BRAND_BG = "#09090b"; // header background

// ---------------------------------------------------------------------------
// SMTP transporter
// Singleton — created once at module load time so the connection pool is reused
// across requests rather than being recreated on every email send.
// ---------------------------------------------------------------------------

const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  // Force TLS on port 465; allow STARTTLS on 587 (nodemailer default behaviour)
  secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Enforce certificate validation in production to prevent MitM attacks
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

/** Thin helper so every `sendMail` call shares the same `from` address. */
export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

// ---------------------------------------------------------------------------
// Base layout
// ---------------------------------------------------------------------------

function buildEmail(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px 32px;
      color: #374151;
      line-height: 1.625;
      font-size: 16px;
    }
    .content h2 {
      color: #111827;
      font-size: 22px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 20px;
      letter-spacing: -0.01em;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 24px;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
      border-top: 1px solid #e5e7eb;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: #111827;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin-top: 8px;
      margin-bottom: 16px;
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #374151;
    }
    .otp-container {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      margin: 32px 0;
    }
    .otp {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #2563eb;
      margin: 0;
    }
    .helper {
      font-size: 14px;
      color: #6b7280;
      margin-top: 24px;
      margin-bottom: 0;
    }
    .fallback-url {
      color: #2563eb;
      text-decoration: underline;
      word-break: break-all;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${APP_NAME}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        <p style="margin: 0;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Verification email
// ---------------------------------------------------------------------------

/**
 * Builds the HTML for the "verify your email address" email.
 *
 * @param url - The one-click verification URL supplied by Better Auth
 */
export function verificationEmail(url: string): string {
  const content = `
    <h2>Welcome to ${APP_NAME}!</h2>
    <p>
      Thanks for signing up. Please verify your email address to activate your
      account and get started.
    </p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Verify Email Address</a>
    </div>
    <div class="divider"></div>
    <p class="helper" style="margin-top: 0;">
      Or copy and paste this link into your browser:<br>
      <a href="${url}" class="fallback-url">${url}</a>
    </p>
    <p class="helper" style="margin-top: 8px;">This link expires in 24 hours.</p>
  `;
  return buildEmail("Verify your email – " + APP_NAME, content);
}

// ---------------------------------------------------------------------------
// Password reset email
// ---------------------------------------------------------------------------

/**
 * Builds the HTML for the "reset your password" email.
 *
 * @param url - The password-reset URL supplied by Better Auth
 */
export function resetPasswordEmail(url: string): string {
  const content = `
    <h2>Reset your password</h2>
    <p>
      We received a request to reset the password for your ${APP_NAME} account.
      If you didn't make this request, you can safely ignore this email — your
      password will not be changed.
    </p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p class="helper" style="margin-top: 0;">
      Or copy and paste this link into your browser:<br>
      <a href="${url}" class="fallback-url">${url}</a>
    </p>
    <p class="helper" style="margin-top: 8px;">This link expires in 1 hour.</p>
  `;
  return buildEmail("Reset your password – " + APP_NAME, content);
}

// ---------------------------------------------------------------------------
// OTP (one-time password) emails
// ---------------------------------------------------------------------------

type OtpEmailType =
  | "email-verification"
  | "sign-in"
  | "forget-password"
  | "change-email";

interface OtpEmailOptions {
  otp: string;
  type: OtpEmailType;
}

/**
 * Returns `{ subject, html }` for the appropriate OTP email variant.
 *
 * @param otp  - The 6-digit (or equivalent) OTP code
 * @param type - The OTP flow: "email-verification", "sign-in", or "forget-password"
 */
export function otpEmail({ otp, type }: OtpEmailOptions): {
  subject: string;
  html: string;
} {
  const templates: Record<
    OtpEmailType,
    { subject: string; heading: string; body: string }
  > = {
    "email-verification": {
      subject: "Your email verification code",
      heading: "Verify your email",
      body: "Use the verification code below to confirm your email address.",
    },
    "change-email": {
      subject: "Confirm your new email address",
      heading: "Confirm email change",
      body: "Use the code below to confirm your new email address.",
    },
    "sign-in": {
      subject: "Your sign-in code",
      heading: `Sign in to ${APP_NAME}`,
      body: "Use the code below to sign in to your account.",
    },
    "forget-password": {
      subject: "Your password-reset code",
      heading: "Reset your password",
      body: "Use the code below to reset your password.",
    },
  };

  const { subject, heading, body } = templates[type];

  const content = `
    <h2>${heading}</h2>
    <p>${body}</p>
    <div class="otp-container">
      <div class="otp">${otp}</div>
    </div>
    <div class="divider"></div>
    <p class="helper">
      This code expires in <strong>10 minutes</strong>. Do not share it with
      anyone. If you didn't request this code, you can safely ignore this email.
    </p>
  `;

  return { subject, html: buildEmail(subject, content) };
}
