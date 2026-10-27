import type { PrismaClient } from "@prisma/client";
import { generateFromCounts } from "../../src/modules/inventory";
import { DEMO_PGS } from "./demo-pgs";
import { TEST_OWNER_PHONES } from "./test-pgs";

export const DEMO_OWNER_PHONE = "+919876543210";

/** Every account that owns sample listings. remove-samples.ts deletes these and everything they own. */
export const SAMPLE_OWNER_PHONES = [DEMO_OWNER_PHONE, ...TEST_OWNER_PHONES];

export async function upsertDemoOwner(prisma: PrismaClient, opts: { blocked: boolean }) {
  const user = await prisma.user.upsert({
    where: { phone: DEMO_OWNER_PHONE },
    update: { role: "OWNER", name: "Rahul Sharma", phoneVerified: true, blocked: opts.blocked },
    create: {
      phone: DEMO_OWNER_PHONE,
      name: "Rahul Sharma",
      email: "rahul@example.com",
      role: "OWNER",
      phoneVerified: true,
      blocked: opts.blocked,
    },
  });

  return prisma.ownerProfile.upsert({
    where: { userId: user.id },
    update: { businessName: "NCR Stays", verificationStatus: "VERIFIED" },
    create: {
      userId: user.id,
      businessName: "NCR Stays",
      verificationStatus: "VERIFIED",
    },
  });
}

export async function seedDemoPgs(
  prisma: PrismaClient,
  ownerId: string,
  amenityBySlug: Record<string, string>,
) {
  for (const demo of DEMO_PGS) {
    const city = await prisma.city.findUniqueOrThrow({ where: { slug: demo.citySlug } });
    const area = await prisma.area.findUniqueOrThrow({
      where: { cityId_slug: { cityId: city.id, slug: demo.areaSlug } },
    });
    const slug = `${demo.name}-${area.name}-${city.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const property = await prisma.property.upsert({
      where: { slug },
      update: {
        status: "PUBLISHED",
        featured: demo.featured,
        verificationLevel: demo.verificationLevel,
        ratingAvg: demo.ratingAvg,
        reviewCount: demo.reviewCount,
        publishedAt: new Date(),
        verifiedAt: demo.verificationLevel === "UNVERIFIED" ? null : new Date("2026-08-18"),
      },
      create: {
        ownerId,
        name: demo.name,
        slug,
        description: demo.description,
        address: demo.address,
        cityId: city.id,
        areaId: area.id,
        latitude: area.latitude ?? city.latitude ?? 28.6,
        longitude: area.longitude ?? city.longitude ?? 77.2,
        pgType: demo.pgType,
        status: "PUBLISHED",
        verificationLevel: demo.verificationLevel,
        featured: demo.featured,
        foodIncluded: demo.foodIncluded,
        maintenanceCharge: demo.maintenanceCharge,
        electricityNote: demo.electricityNote,
        vegetarianFood: demo.pgType === "GIRLS",
        visitorsAllowed: demo.pgType !== "GIRLS",
        ratingAvg: demo.ratingAvg,
        reviewCount: demo.reviewCount,
        publishedAt: new Date(),
        verifiedAt: demo.verificationLevel === "UNVERIFIED" ? null : new Date("2026-08-18"),
        availabilityConfirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });

    await prisma.propertyAmenity.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyAmenity.createMany({
      data: demo.amenities
        .filter((s) => amenityBySlug[s])
        .map((s) => ({ propertyId: property.id, amenityId: amenityBySlug[s] })),
    });

    await prisma.photo.deleteMany({ where: { propertyId: property.id } });
    await prisma.photo.createMany({
      data: demo.photos.map((url, index) => ({
        propertyId: property.id,
        url,
        alt: demo.name,
        sortOrder: index,
      })),
    });

    await generateFromCounts(property.id, demo.rooms, prisma);

    if (demo.verificationLevel === "PGDOOR_VERIFIED") {
      const types = ["PROPERTY", "OWNER", "PHOTOS", "ADDRESS", "AMENITIES", "PRICING", "AVAILABILITY"] as const;
      for (const type of types) {
        await prisma.verificationCheck.upsert({
          where: { propertyId_type: { propertyId: property.id, type } },
          update: { passed: true, checkedAt: new Date("2026-08-18") },
          create: {
            propertyId: property.id,
            type,
            passed: true,
            checkedAt: new Date("2026-08-18"),
          },
        });
      }
    }
  }
}
