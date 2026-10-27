import { PrismaClient } from "@prisma/client";
import { seedReference } from "./reference";
import { seedDemoPgs, upsertDemoOwner } from "./samples";
import { seedTestPgs } from "./test-pgs";

const prisma = new PrismaClient();

async function main() {
  await seedReference(prisma);

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

  const owner = await upsertDemoOwner(prisma, { blocked: false });

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

  await seedDemoPgs(prisma, owner.id, amenityBySlug);

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

  const testPgs = await seedTestPgs(prisma, amenityBySlug);
  console.info(
    `Test PGs (Noida + Greater Noida): inserted ${testPgs.inserted}, skipped ${testPgs.skipped} existing`,
  );

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
