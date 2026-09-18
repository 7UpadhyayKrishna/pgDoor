import {
  PropertyStatus,
  VerificationCheckType,
  VerificationLevel,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";

const CHECKS: VerificationCheckType[] = [
  "PROPERTY",
  "OWNER",
  "PHOTOS",
  "ADDRESS",
  "AMENITIES",
  "PRICING",
  "AVAILABILITY",
];

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

export async function setVerificationLevel(
  propertyId: string,
  level: VerificationLevel,
  actorId: string,
) {
  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      verificationLevel: level,
      verifiedAt: level === "UNVERIFIED" ? null : new Date(),
    },
  });

  const passed =
    level === "PGDOOR_VERIFIED"
      ? CHECKS
      : level === "PROPERTY_VERIFIED"
        ? CHECKS.filter((c) => ["PROPERTY", "OWNER", "PHOTOS", "ADDRESS"].includes(c))
        : level === "OWNER_VERIFIED"
          ? (["OWNER"] as VerificationCheckType[])
          : [];

  await prisma.$transaction(
    CHECKS.map((type) =>
      prisma.verificationCheck.upsert({
        where: { propertyId_type: { propertyId, type } },
        update: {
          passed: passed.includes(type),
          checkedAt: passed.includes(type) ? new Date() : null,
        },
        create: {
          propertyId,
          type,
          passed: passed.includes(type),
          checkedAt: passed.includes(type) ? new Date() : null,
        },
      }),
    ),
  );

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

export async function listForAdmin(status?: PropertyStatus) {
  return prisma.property.findMany({
    where: status ? { status } : undefined,
    include: {
      city: true,
      area: true,
      owner: { include: { user: { select: { name: true, phone: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function requirePublished(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new HttpError(404, "PG not found");
  return property;
}
