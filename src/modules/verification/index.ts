import {
  type CheckStatus,
  type Prisma,
  PropertyStatus,
  VerificationCheckType,
  VerificationLevel,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";
import { isAllowedPhotoUrl } from "@/lib/storage";
import { CHECK_TYPES, deriveLevel } from "./levels";

export { CHECK_LABEL, CHECK_TYPES, checkProgress, deriveLevel } from "./levels";

const CHECKS = CHECK_TYPES;

export function badgePayload(level: VerificationLevel, verifiedAt: Date | null) {
  const flags = {
    property: level !== "UNVERIFIED",
    owner: level === "OWNER_VERIFIED" || level === "PROPERTY_VERIFIED" || level === "PGDOOR_VERIFIED",
    photos: level === "PROPERTY_VERIFIED" || level === "PGDOOR_VERIFIED",
    address: level === "PROPERTY_VERIFIED" || level === "PGDOOR_VERIFIED",
    amenities: level === "PGDOOR_VERIFIED",
    pricing: level === "PGDOOR_VERIFIED",
    availability: level === "PGDOOR_VERIFIED",
  };
  return { level, verifiedAt, flags };
}

async function applyLevel(propertyId: string, level: VerificationLevel) {
  const current = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: { verificationLevel: true, verifiedAt: true },
  });
  if (current.verificationLevel === level) return current;
  return prisma.property.update({
    where: { id: propertyId },
    data: {
      verificationLevel: level,
      verifiedAt: level === "UNVERIFIED" ? null : new Date(),
    },
  });
}

export async function setVerificationLevel(
  propertyId: string,
  level: VerificationLevel,
  actorId: string,
) {
  const passed =
    level === "PGDOOR_VERIFIED"
      ? CHECKS
      : level === "PROPERTY_VERIFIED"
        ? CHECKS.filter((c) => ["PROPERTY", "OWNER", "PHOTOS", "ADDRESS"].includes(c))
        : level === "OWNER_VERIFIED"
          ? (["OWNER"] as VerificationCheckType[])
          : [];

  const now = new Date();
  await prisma.$transaction(
    CHECKS.map((type) => {
      const ok = passed.includes(type);
      const data = {
        passed: ok,
        status: (ok ? "PASSED" : "PENDING") as CheckStatus,
        checkedAt: ok ? now : null,
        checkedById: ok ? actorId : null,
      };
      return prisma.verificationCheck.upsert({
        where: { propertyId_type: { propertyId, type } },
        update: data,
        create: { propertyId, type, ...data },
      });
    }),
  );

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      verificationLevel: level,
      verifiedAt: level === "UNVERIFIED" ? null : now,
    },
  });
  if (passed.includes("OWNER")) await markOwnerVerified(property.ownerId);

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "VERIFY",
      entityType: "property",
      entityId: propertyId,
      metadata: { level },
    },
  });

  return property;
}

async function markOwnerVerified(ownerProfileId: string) {
  await prisma.ownerProfile.update({
    where: { id: ownerProfileId },
    data: { verificationStatus: "VERIFIED" },
  });
}

export const checkInputSchema = z.object({
  status: z.enum(["PENDING", "PASSED", "FAILED", "NOT_APPLICABLE"]),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || null),
  evidenceUrls: z.array(z.string().max(1000)).max(10).default([]),
});

export async function setCheck(
  propertyId: string,
  type: VerificationCheckType,
  parsed: z.infer<typeof checkInputSchema>,
  actorId: string,
) {
  if (parsed.evidenceUrls.some((url) => !isAllowedPhotoUrl(url))) {
    throw new HttpError(400, "Evidence photos must be uploaded through pgDoor");
  }
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true },
  });
  if (!property) throw new HttpError(404, "PG not found");

  const settled = parsed.status !== "PENDING";
  const data = {
    status: parsed.status,
    passed: parsed.status === "PASSED",
    notes: parsed.notes,
    evidenceUrls: parsed.evidenceUrls,
    checkedById: settled ? actorId : null,
    checkedAt: settled ? new Date() : null,
  };
  await prisma.verificationCheck.upsert({
    where: { propertyId_type: { propertyId, type } },
    update: data,
    create: { propertyId, type, ...data },
  });

  const checks = await prisma.verificationCheck.findMany({
    where: { propertyId },
    select: { type: true, status: true },
  });
  const level = deriveLevel(checks);
  await applyLevel(propertyId, level);
  if (type === "OWNER" && parsed.status === "PASSED") await markOwnerVerified(property.ownerId);

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "CHECK",
      entityType: "property",
      entityId: propertyId,
      metadata: { type, status: parsed.status, level, notes: parsed.notes },
    },
  });

  return { level };
}

export async function moderateProperty(
  propertyId: string,
  action: "APPROVE" | "REJECT" | "SUSPEND" | "FEATURE" | "UNFEATURE",
  actorId: string,
) {
  const data: {
    status?: PropertyStatus;
    featured?: boolean;
    publishedAt?: Date | null;
  } = {};

  if (action === "APPROVE") {
    data.status = "PUBLISHED";
    data.publishedAt = new Date();
  }
  if (action === "REJECT") data.status = "REJECTED";
  if (action === "SUSPEND") data.status = "SUSPENDED";
  if (action === "FEATURE") data.featured = true;
  if (action === "UNFEATURE") data.featured = false;

  const property = await prisma.property.update({
    where: { id: propertyId },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType: "property",
      entityId: propertyId,
    },
  });

  return property;
}

export type AdminPropertyFilters = {
  status?: PropertyStatus;
  level?: VerificationLevel;
  ownerId?: string;
  q?: string;
};

export async function listForAdmin(filters: AdminPropertyFilters | PropertyStatus = {}) {
  const f: AdminPropertyFilters = typeof filters === "string" ? { status: filters } : filters;
  const q = f.q?.trim();
  const digits = q?.replace(/\D/g, "");
  const where: Prisma.PropertyWhereInput = {
    ...(f.status ? { status: f.status } : {}),
    ...(f.level ? { verificationLevel: f.level } : {}),
    ...(f.ownerId ? { ownerId: f.ownerId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            ...(digits && digits.length >= 4
              ? [{ owner: { user: { phone: { contains: digits } } } }, { contactPhone: { contains: digits } }]
              : []),
          ],
        }
      : {}),
  };
  return prisma.property.findMany({
    where,
    include: {
      city: true,
      area: true,
      owner: { include: { user: { select: { name: true, phone: true } } } },
      verificationChecks: { select: { type: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getPropertyForVerification(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      city: true,
      area: true,
      photos: { orderBy: { sortOrder: "asc" }, take: 8 },
      roomTypes: true,
      owner: {
        include: {
          user: { select: { name: true, phone: true, lastLoginAt: true, passwordHash: true } },
        },
      },
      verificationChecks: {
        include: { checkedBy: { select: { name: true, phone: true } } },
      },
      _count: { select: { reports: true, leads: true } },
    },
  });
  if (!property) throw new HttpError(404, "PG not found");
  return property;
}

export async function propertyAuditTrail(propertyId: string) {
  return prisma.auditLog.findMany({
    where: { entityType: "property", entityId: propertyId },
    include: { actor: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function requirePublished(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new HttpError(404, "PG not found");
  return property;
}
