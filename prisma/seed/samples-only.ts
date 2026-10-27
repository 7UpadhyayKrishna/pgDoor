import { PrismaClient } from "@prisma/client";
import { seedReference } from "./reference";
import { SAMPLE_OWNER_PHONES, seedDemoPgs, upsertDemoOwner } from "./samples";
import { seedTestPgs } from "./test-pgs";

/**
 * Sample listings for a shared database: no admin or seeker accounts, and every sample owner
 * is blocked so nobody can sign in as them. Remove with `npm run db:samples:remove`.
 */
const prisma = new PrismaClient();

async function main() {
  await seedReference(prisma);

  const amenityRows = await prisma.amenity.findMany();
  const amenityBySlug = Object.fromEntries(amenityRows.map((a) => [a.slug, a.id]));

  const owner = await upsertDemoOwner(prisma, { blocked: true });
  await seedDemoPgs(prisma, owner.id, amenityBySlug);
  console.info("Demo PGs ready");

  const testPgs = await seedTestPgs(prisma, amenityBySlug);
  console.info(`Test PGs: inserted ${testPgs.inserted}, skipped ${testPgs.skipped} existing`);

  const blocked = await prisma.user.updateMany({
    where: { phone: { in: SAMPLE_OWNER_PHONES } },
    data: { blocked: true },
  });
  console.info(`Blocked ${blocked.count} sample owner accounts`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
