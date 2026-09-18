import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  phoneVerified: boolean;
  ownerProfileId: string | null;
};

export function isOwner(user: AuthUser | null) {
  return user?.role === "OWNER" || user?.role === "ADMIN" || Boolean(user?.ownerProfileId);
}

export function isAdmin(user: AuthUser | null) {
  return user?.role === "ADMIN";
}

export function canAccessOwner(user: AuthUser | null) {
  return isOwner(user);
}

export function canAccessAdmin(user: AuthUser | null) {
  return isAdmin(user);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
