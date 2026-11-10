import { createHash, randomInt } from "crypto";
import { OTP_TTL_MINUTES } from "@/lib/constants";
import { HttpError } from "@/lib/rbac";
import { SmsDeliveryError, sendMsg91Otp } from "@/lib/sms/msg91";

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function otpProvider() {
  return process.env.OTP_PROVIDER ?? "dev";
}

/** The fixed dev code is never honoured on a production deploy, whatever OTP_PROVIDER says. */
export function isDevOtp() {
  return (
    otpProvider() === "dev" &&
    process.env.VERCEL_ENV !== "production" &&
    process.env.APP_ENV !== "production"
  );
}

export function generateOtpCode() {
  if (isDevOtp() && process.env.OTP_BYPASS_CODE) {
    return process.env.OTP_BYPASS_CODE;
  }
  return String(randomInt(100000, 1000000));
}

export function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export async function sendOtp(phone: string, code: string) {
  const provider = otpProvider();
  if (provider === "msg91") {
    try {
      await sendMsg91Otp(phone, code);
    } catch (error) {
      if (error instanceof SmsDeliveryError) {
        console.error(`[otp] ${error.message}`);
        throw new HttpError(502, "We couldn't send the OTP right now. Please try again.");
      }
      throw error;
    }
    return { delivered: true, provider };
  }
  if (isDevOtp()) {
    console.info(`[otp] ${phone} → ${code}`);
    return { delivered: true, provider };
  }
  console.error(`[otp] no SMS provider configured (OTP_PROVIDER=${provider})`);
  throw new HttpError(503, "OTP login is temporarily unavailable. Please use password login.");
}

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (input.startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new Error("Enter a valid 10-digit Indian mobile number");
}
