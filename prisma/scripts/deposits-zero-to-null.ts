import { PrismaClient } from "@prisma/client";

/**
 * One-off: listings imported before deposits were nullable stored "unknown" as 0.
 * Turns every 0 deposit into NULL so the site shows "Ask owner", then recomputes
 * Property.minDeposit from the remaining known deposits. Pass --dry-run to preview.
 */
const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const zeroRooms = await prisma.roomType.findMany({
    where: { deposit: 0 },
    select: { id: true, sharingType: true, property: { select: { slug: true } } },
  });
  console.info(`${zeroRooms.length} room types have a 0 deposit`);
  for (const room of zeroRooms) console.info(`  ${room.property.slug} · ${room.sharingType}`);
  if (dryRun) return;

  await prisma.roomType.updateMany({ where: { deposit: 0 }, data: { deposit: null } });

  const properties = await prisma.property.findMany({
    select: { id: true, minDeposit: true, roomTypes: { select: { deposit: true } } },
  });
  let updated = 0;
  for (const property of properties) {
    const known = property.roomTypes.flatMap((rt) => (rt.deposit == null ? [] : [rt.deposit]));
    const minDeposit = known.length ? Math.min(...known) : null;
    if (minDeposit === property.minDeposit) continue;
    await prisma.property.update({ where: { id: property.id }, data: { minDeposit } });
    updated += 1;
  }
  console.info(`Recomputed minDeposit on ${updated} properties`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
