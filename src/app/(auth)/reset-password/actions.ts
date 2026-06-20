"use server";

import { redis } from "@/lib/redis";

export async function verifyResetOtpServer(email: string, otp: string): Promise<boolean> {
  if (!email || !otp) return false;

  try {
    // Better Auth stores verification tokens in Redis when secondaryStorage is enabled
    // The key format for password reset OTPs is: verification:forget-password-otp-<email>
    const key = `verification:forget-password-otp-${email}`;
    const data = await redis.get(key);

    if (!data) {
      return false; // Not found or expired
    }

    // Depending on the redis client, data might be a JSON object or string
    const verification = typeof data === "string" ? JSON.parse(data) : data;

    // Better Auth sometimes appends a retry count or similar to the value, e.g., "123456:0"
    // So we split by ":" and check the first part.
    const storedValue = verification.value || "";
    const storedOtp = storedValue.includes(":") ? storedValue.split(":")[0] : storedValue;

    if (storedOtp !== otp) {
      return false;
    }

    if (new Date(verification.expiresAt) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to verify OTP:", error);
    return false;
  }
}
