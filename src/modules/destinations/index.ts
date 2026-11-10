import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { cellFor } from "@/lib/geo/h3";
import { autocompletePlaces, getPlaceDetails } from "@/lib/places";

export type DestinationHit = {
  placeId: string;
  description: string;
  latitude?: number;
  longitude?: number;
  seeded: boolean;
  slug?: string;
};

export async function suggestDestinations(query: string): Promise<DestinationHit[]> {
  const q = query.trim();
  if (q.length < 2) {
    const popular = await prisma.destination.findMany({
      orderBy: { popularity: "desc" },
      take: 12,
    });
    return popular.map((d) => ({
      placeId: `seed:${d.slug}`,
      description: d.name,
      latitude: d.latitude,
      longitude: d.longitude,
      seeded: true,
      slug: d.slug,
    }));
  }

  const tokens = q.toLowerCase();
  const seeded = await prisma.destination.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: slugify(q), mode: "insensitive" } },
        { aliases: { hasSome: [q, tokens] } },
      ],
    },
    orderBy: { popularity: "desc" },
    take: 8,
  });

  const hits: DestinationHit[] = seeded.map((d) => ({
    placeId: `seed:${d.slug}`,
    description: d.name,
    latitude: d.latitude,
    longitude: d.longitude,
    seeded: true,
    slug: d.slug,
  }));

  try {
    const google = await autocompletePlaces(q, { forDestination: true });
    for (const g of google) {
      if (hits.some((h) => h.description.toLowerCase() === g.description.toLowerCase())) continue;
      hits.push({
        placeId: g.placeId,
        description: g.description,
        seeded: false,
      });
    }
  } catch {
    // seeded list still works offline
  }

  return hits.slice(0, 12);
}

export async function resolveDestination(placeId: string, label?: string) {
  if (placeId.startsWith("seed:")) {
    const slug = placeId.slice(5);
    const dest = await prisma.destination.findUnique({ where: { slug } });
    if (!dest) return null;
    return {
      placeId,
      label: dest.name,
      latitude: dest.latitude,
      longitude: dest.longitude,
      slug: dest.slug,
    };
  }
  const details = await getPlaceDetails(placeId);
  return {
    placeId,
    label: label || details.address,
    latitude: details.latitude,
    longitude: details.longitude,
  };
}

export async function getSeoDestinations() {
  return prisma.destination.findMany({
    where: { seoEnabled: true },
    orderBy: { popularity: "desc" },
  });
}

export async function getDestinationBySlug(slug: string) {
  return prisma.destination.findUnique({ where: { slug } });
}

export async function ensureCustomDestination(lat: number, lng: number, label: string) {
  const slug = `pin-${cellFor(lat, lng)}`;
  return prisma.destination.upsert({
    where: { slug },
    update: { name: label },
    create: {
      name: label,
      slug,
      type: "CUSTOM",
      latitude: lat,
      longitude: lng,
      h3Cell: cellFor(lat, lng),
      aliases: [label],
      popularity: 1,
    },
  });
}
