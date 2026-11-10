import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";

async function publishedPropertyId(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });
  if (!property || property.status !== "PUBLISHED") throw new HttpError(404, "PG not found");
  return property.id;
}

export async function isWatching(userId: string, slug: string) {
  const propertyId = await publishedPropertyId(slug);
  const row = await prisma.availabilityWatch.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
    select: { notifiedAt: true },
  });
  return Boolean(row && !row.notifiedAt);
}

export async function watchProperty(userId: string, slug: string) {
  const propertyId = await publishedPropertyId(slug);
  return prisma.availabilityWatch.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    update: { notifiedAt: null },
    create: { userId, propertyId },
  });
}

export async function unwatchProperty(userId: string, slug: string) {
  const propertyId = await publishedPropertyId(slug);
  await prisma.availabilityWatch.deleteMany({ where: { userId, propertyId } });
}

/** Called after availability is recomputed: a full PG that frees up a bed alerts its watchers once. */
export async function notifyWatchersIfReopened(
  property: { id: string; name: string; slug: string; availableBeds: number },
  previousAvailableBeds: number,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  if (previousAvailableBeds > 0 || property.availableBeds <= 0) return 0;
  const watches = await client.availabilityWatch.findMany({
    where: { propertyId: property.id, notifiedAt: null },
    select: { id: true, userId: true },
  });
  if (!watches.length) return 0;
  const beds = property.availableBeds === 1 ? "1 bed is" : `${property.availableBeds} beds are`;
  await client.alert.createMany({
    data: watches.map((watch) => ({
      userId: watch.userId,
      propertyId: property.id,
      title: `${property.name} has a bed free`,
      body: `${beds} available now at ${property.name}. Book a visit before it fills up: /pg/${property.slug}`,
    })),
  });
  await client.availabilityWatch.updateMany({
    where: { id: { in: watches.map((w) => w.id) } },
    data: { notifiedAt: new Date() },
  });
  return watches.length;
}
