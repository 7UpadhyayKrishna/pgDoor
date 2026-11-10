import { PrismaClient } from "@prisma/client";
import { seedDestinations } from "./destinations";

const prisma = new PrismaClient();

seedDestinations(prisma)
  .then(async () => {
    const n = await prisma.destination.count();
    const seo = await prisma.destination.count({ where: { seoEnabled: true } });
    console.info(`Destinations: ${n}, SEO pages: ${seo}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
