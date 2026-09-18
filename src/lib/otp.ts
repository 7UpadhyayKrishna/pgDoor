import { createHash, randomInt } from "crypto";
import { OTP_TTL_MINUTES } from "@/lib/constants";

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOtpCode() {
  if (process.env.OTP_PROVIDER === "dev" && process.env.OTP_BYPASS_CODE) {
    return process.env.OTP_BYPASS_CODE;
  }
  return String(randomInt(100000, 1000000));
}

export function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export async function sendOtp(phone: string, code: string) {
  const provider = process.env.OTP_PROVIDER ?? "dev";
  if (provider === "dev") {
    console.info(`[otp] ${phone} → ${code}`);
    return { delivered: true, provider };
  }
  // MSG91 / Twilio adapters plug in here without changing callers.
  console.info(`[otp] would send via ${provider} to ${phone}`);
  return { delivered: true, provider };
}

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (input.startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new Error("Enter a valid 10-digit Indian mobile number");
}
