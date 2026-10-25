import { PrismaClient } from "@prisma/client";
import { seedReference } from "./reference";

const prisma = new PrismaClient();

seedReference(prisma)
  .then(async () => {
    const [cities, areas, amenities] = await Promise.all([
      prisma.city.count(),
      prisma.area.count(),
      prisma.amenity.count(),
    ]);
    console.info(`Reference data ready: ${cities} cities, ${areas} areas, ${amenities} amenities`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
