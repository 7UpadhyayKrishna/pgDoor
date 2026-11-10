import { PrismaClient } from "@prisma/client";
import { cellFor } from "../../src/lib/geo/h3";
import { listingSlug } from "../../src/lib/utils";

/**
 * Re-pins a listing and/or rebuilds listing slugs from name + area + city, keeping the
 * old slug as a 301 redirect.
 *
 *   Rebuild every slug that repeats its area (e.g. "...-sector-45-sector-45-gurgaon"):
 *     npm run db:slugs -- --dry-run
 *     npm run db:slugs
 *
 *   Re-pin one listing to the right area and coordinates, then rebuild its slug:
 *     npm run db:slugs -- --slug settl-emly-pg-sector-45-gurgaon --area sector-39 --lat 28.4433 --lng 77.0524
 */
const prisma = new PrismaClient();

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const dryRun = process.argv.includes("--dry-run");

async function freeSlug(base: string, propertyId: string) {
  let slug = base;
  let i = 2;
  for (;;) {
    const [taken, redirect] = await Promise.all([
      prisma.property.findUnique({ where: { slug }, select: { id: true } }),
      prisma.propertySlugRedirect.findUnique({ where: { slug }, select: { propertyId: true } }),
    ]);
    if ((!taken || taken.id === propertyId) && (!redirect || redirect.propertyId === propertyId)) {
      return slug;
    }
    slug = `${base}-${i}`;
    i += 1;
  }
}

async function repin(slug: string) {
  const areaSlug = arg("area");
  const lat = arg("lat") ? Number(arg("lat")) : undefined;
  const lng = arg("lng") ? Number(arg("lng")) : undefined;
  const property = await prisma.property.findUniqueOrThrow({
    where: { slug },
    select: { id: true, cityId: true, latitude: true, longitude: true },
  });
  const area = areaSlug
    ? await prisma.area.findUniqueOrThrow({
        where: { cityId_slug: { cityId: property.cityId, slug: areaSlug } },
        select: { id: true, name: true },
      })
    : null;
  const latitude = lat ?? property.latitude;
  const longitude = lng ?? property.longitude;
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) throw new Error("--lat/--lng must be numbers");
  console.info(
    `Re-pin ${slug}: ${area ? `area -> ${area.name}, ` : ""}(${latitude}, ${longitude})`,
  );
  if (dryRun) return property.id;
  await prisma.$transaction([
    prisma.property.update({
      where: { id: property.id },
      data: {
        ...(area ? { areaId: area.id } : {}),
        latitude,
        longitude,
        h3Cell: cellFor(latitude, longitude),
      },
    }),
    // Cached commute times and nearby places were computed from the old pin.
    prisma.commuteEdge.deleteMany({ where: { propertyId: property.id } }),
    prisma.propertyPoi.deleteMany({ where: { propertyId: property.id } }),
  ]);
  return property.id;
}

async function main() {
  const target = arg("slug");
  const onlyId = target ? await repin(target) : undefined;

  const properties = await prisma.property.findMany({
    where: onlyId ? { id: onlyId } : undefined,
    select: { id: true, slug: true, name: true, area: { select: { name: true } }, city: { select: { name: true } } },
  });

  let changed = 0;
  for (const property of properties) {
    const base = listingSlug(property.name, property.area.name, property.city.name);
    const current = property.slug.replace(/-\d+$/, "");
    if (current === base || property.slug === base) continue;
    // Seeded test listings carry a "-t0001" suffix on purpose; leave them alone.
    if (/-t\d{4}$/.test(property.slug)) continue;
    const next = dryRun ? base : await freeSlug(base, property.id);
    console.info(`${property.slug} -> ${next}`);
    changed += 1;
    if (dryRun) continue;
    await prisma.$transaction([
      prisma.propertySlugRedirect.upsert({
        where: { slug: property.slug },
        update: { propertyId: property.id },
        create: { slug: property.slug, propertyId: property.id },
      }),
      prisma.property.update({ where: { id: property.id }, data: { slug: next } }),
      prisma.propertySlugRedirect.deleteMany({ where: { slug: next } }),
    ]);
  }
  console.info(`${dryRun ? "Would change" : "Changed"} ${changed} slug(s)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
