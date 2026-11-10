import { z } from "zod";
import { OTP_MAX_PER_WINDOW, OTP_WINDOW_MINUTES } from "@/lib/constants";
import { generateOtpCode, hashSecret, normalizePhone, otpExpiry, sendOtp } from "@/lib/otp";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { HttpError } from "@/lib/rbac";
import { createSession, destroySession } from "@/lib/session";
import { markOwnerOnboarded } from "@/modules/crm";

const PASSWORD_LOGIN_MAX = 5;
const PASSWORD_LOGIN_WINDOW_MS = 10 * 60 * 1000;

export const passwordLoginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(1, "Enter your password"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(128),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(10),
  purpose: z.enum(["LOGIN", "ENQUIRY", "OWNER_REGISTER"]).default("LOGIN"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().min(4).max(8),
  purpose: z.enum(["LOGIN", "ENQUIRY", "OWNER_REGISTER"]).default("LOGIN"),
  name: z.string().min(2).optional(),
});

export async function requestOtp(input: z.infer<typeof sendOtpSchema>) {
  const phone = normalizePhone(input.phone);
  const limited = rateLimit(
    `otp:${phone}:${input.purpose}`,
    OTP_MAX_PER_WINDOW,
    OTP_WINDOW_MINUTES * 60 * 1000,
  );
  if (!limited.ok) {
    throw new HttpError(429, "Too many OTP requests. Try again in a few minutes.");
  }

  const code = generateOtpCode();
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashSecret(code),
      purpose: input.purpose,
      expiresAt: otpExpiry(),
    },
  });
  await sendOtp(phone, code);
  return { phone, dev: process.env.OTP_PROVIDER === "dev" };
}

export async function verifyOtpAndSession(input: z.infer<typeof verifyOtpSchema>) {
  const phone = normalizePhone(input.phone);
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.codeHash !== hashSecret(input.code)) {
    throw new HttpError(401, "Invalid or expired OTP");
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      phoneVerified: true,
      ...(input.name ? { name: input.name } : {}),
    },
    create: {
      phone,
      name: input.name,
      phoneVerified: true,
      role: input.purpose === "OWNER_REGISTER" ? "OWNER" : "SEEKER",
    },
    include: { ownerProfile: true },
  });

  if (input.purpose === "OWNER_REGISTER") {
    if (!user.ownerProfile) {
      await prisma.ownerProfile.create({
        data: { userId: user.id },
      });
    }
    if (user.role === "SEEKER") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "OWNER" } });
    }
  }

  await createSession(user.id);
  await recordLogin(user.id, user.lastLoginAt);
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { ownerProfile: true },
  });
}

async function recordLogin(userId: string, previousLoginAt: Date | null) {
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  if (!previousLoginAt) await markOwnerOnboarded(userId);
}

export async function loginWithPassword(input: z.infer<typeof passwordLoginSchema>) {
  const phone = normalizePhone(input.phone);
  const limited = rateLimit(`pwd:${phone}`, PASSWORD_LOGIN_MAX, PASSWORD_LOGIN_WINDOW_MS);
  if (!limited.ok) {
    throw new HttpError(429, "Too many attempts. Try again in a few minutes.");
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    include: { ownerProfile: true },
  });
  if (!user || user.blocked || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "Wrong mobile number or password");
  }

  await createSession(user.id);
  await recordLogin(user.id, user.lastLoginAt);
  return user;
}

export async function changePassword(
  userId: string,
  input: z.infer<typeof changePasswordSchema>,
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  // A forced change right after a temp-password login skips the current-password prompt.
  if (user.passwordHash && !user.mustChangePassword) {
    if (!input.currentPassword || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new HttpError(401, "Current password is incorrect");
    }
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false },
  });
}

export async function logout() {
  await destroySession();
}

export async function ensureOwnerProfile(userId: string) {
  const existing = await prisma.ownerProfile.findUnique({ where: { userId } });
  if (existing) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role === "SEEKER") {
      await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
      await createSession(userId);
    }
    return existing;
  }
  const profile = await prisma.ownerProfile.create({ data: { userId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role === "SEEKER") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "OWNER" },
    });
    await createSession(userId);
  }
  return profile;
}
