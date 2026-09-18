import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/constants";
import { hashSecret } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-session-secret-pgdoor-local-only",
  );
}

export async function signAuthToken(input: { id: string; role: UserRole }) {
  return new SignJWT({ role: input.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return {
    id: String(payload.sub),
    role: payload.role as UserRole,
  };
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const token = await signAuthToken({ id: user.id, role: user.role });
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, tokenHash: hashSecret(token), expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSecret(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    await verifyAuthToken(token);
  } catch {
    return null;
  }

  let session;
  try {
    session = await prisma.session.findUnique({
      where: { tokenHash: hashSecret(token) },
      include: {
        user: { include: { ownerProfile: true } },
      },
    });
  } catch {
    return null;
  }

  if (!session || session.expiresAt < new Date() || session.user.blocked) {
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneVerified: user.phoneVerified,
    ownerProfileId: user.ownerProfile?.id ?? null,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const { HttpError } = await import("@/lib/rbac");
    throw new HttpError(401, "Sign in to continue");
  }
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    const { HttpError } = await import("@/lib/rbac");
    throw new HttpError(403, "Owner access required");
  }
  if (!user.ownerProfileId && user.role !== "ADMIN") {
    const { HttpError } = await import("@/lib/rbac");
    throw new HttpError(403, "Complete owner registration first");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const { HttpError } = await import("@/lib/rbac");
    throw new HttpError(403, "Admin access required");
  }
  return user;
}
