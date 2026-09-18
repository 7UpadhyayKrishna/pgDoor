import { PrismaClient } from "@prisma/client";
import { AMENITIES } from "./amenities";
import { NCR_CITIES } from "./cities-ncr";
import { DEMO_PGS } from "./demo-pgs";
import { generateFromCounts } from "../../src/modules/inventory";

const prisma = new PrismaClient();

async function main() {
  await prisma.amenity.createMany({ data: AMENITIES, skipDuplicates: true });

  for (const city of NCR_CITIES) {
    const row = await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      create: {
        name: city.name,
        slug: city.slug,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
      },
    });

    for (const area of city.areas) {
      await prisma.area.upsert({
        where: { cityId_slug: { cityId: row.id, slug: area.slug } },
        update: {
          name: area.name,
          latitude: area.latitude,
          longitude: area.longitude,
        },
        create: {
          cityId: row.id,
          name: area.name,
          slug: area.slug,
          latitude: area.latitude,
          longitude: area.longitude,
        },
      });
    }

    for (const landmark of city.landmarks) {
      const area = await prisma.area.findUnique({
        where: { cityId_slug: { cityId: row.id, slug: landmark.areaSlug } },
      });
      await prisma.landmark.upsert({
        where: { cityId_slug: { cityId: row.id, slug: landmark.slug } },
        update: { name: landmark.name, type: landmark.type },
        create: {
          cityId: row.id,
          areaId: area?.id,
          name: landmark.name,
          slug: landmark.slug,
          type: landmark.type,
          latitude: landmark.latitude,
          longitude: landmark.longitude,
        },
      });
    }
  }

  const admin = await prisma.user.upsert({
    where: { phone: "+919999999999" },
    update: { role: "ADMIN", name: "pgDoor Admin", phoneVerified: true },
    create: {
      phone: "+919999999999",
      name: "pgDoor Admin",
      email: "admin@pgdoor.in",
      role: "ADMIN",
      phoneVerified: true,
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { phone: "+919876543210" },
    update: { role: "OWNER", name: "Rahul Sharma", phoneVerified: true },
    create: {
      phone: "+919876543210",
      name: "Rahul Sharma",
      email: "rahul@example.com",
      role: "OWNER",
      phoneVerified: true,
    },
  });

  const owner = await prisma.ownerProfile.upsert({
    where: { userId: ownerUser.id },
    update: { businessName: "NCR Stays", verificationStatus: "VERIFIED" },
    create: {
      userId: ownerUser.id,
      businessName: "NCR Stays",
      verificationStatus: "VERIFIED",
    },
  });

  const seeker = await prisma.user.upsert({
    where: { phone: "+918888888888" },
    update: { name: "Ananya", phoneVerified: true },
    create: {
      phone: "+918888888888",
      name: "Ananya",
      role: "SEEKER",
      phoneVerified: true,
    },
  });

  const amenityRows = await prisma.amenity.findMany();
  const amenityBySlug = Object.fromEntries(amenityRows.map((a) => [a.slug, a.id]));

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
        ownerId: owner.id,
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

  const urban = await prisma.property.findFirst({ where: { slug: { contains: "urbannest" } } });
  if (urban) {
    await prisma.review.upsert({
      where: { userId_propertyId: { userId: seeker.id, propertyId: urban.id } },
      update: {},
      create: {
        userId: seeker.id,
        propertyId: urban.id,
        overall: 4.5,
        comment: "Clean rooms, meals on time, and the owner actually updates availability.",
        scores: {
          create: {
            cleanliness: 4.5,
            food: 4.2,
            location: 4.7,
            management: 4.3,
            value: 4.4,
          },
        },
      },
    });
  }

  console.info("Seeded NCR cities, amenities, demo PGs, admin +919999999999, owner +919876543210");
  void admin;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
