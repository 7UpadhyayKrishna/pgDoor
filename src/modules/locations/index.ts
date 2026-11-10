import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { fetchNearbyPlaces, type NearbyPlace } from "@/lib/places";
import { normalizeQuery, scoreAreaMatch } from "@/modules/locations/score";

export async function listCities() {
  return prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      areas: { orderBy: { name: "asc" } },
    },
  });
}

/** Lightweight city list for search dropdowns (no areas). */
export async function listCityOptions() {
  return prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });
}

export const getCachedCityOptions = unstable_cache(
  async () => listCityOptions(),
  ["city-options"],
  { revalidate: 300 },
);

export type CityInventory = {
  name: string;
  slug: string;
  count: number;
  /** A real listing photo from this city, so tiles never show another city's landmark. */
  photo: string | null;
};

async function loadCityInventory(): Promise<CityInventory[]> {
  const [cities, counts] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true } }),
    prisma.property.groupBy({ by: ["cityId"], where: { status: "PUBLISHED" }, _count: true }),
  ]);
  const countByCity = new Map(counts.map((row) => [row.cityId, row._count]));
  const rows = await Promise.all(
    cities.map(async (city) => {
      const count = countByCity.get(city.id) ?? 0;
      const sample = count
        ? await prisma.photo.findFirst({
            where: { property: { cityId: city.id, status: "PUBLISHED" } },
            orderBy: [{ property: { featured: "desc" } }, { sortOrder: "asc" }],
            select: { url: true },
          })
        : null;
      return { name: city.name, slug: city.slug, count, photo: sample?.url ?? null };
    }),
  );
  return rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Cities with their live PG count (5 min cache) for homepage tiles and the footer. */
export const getCachedCityInventory = unstable_cache(loadCityInventory, ["city-inventory"], {
  revalidate: 300,
});

export async function getCityBySlug(slug: string) {
  return prisma.city.findUnique({
    where: { slug },
    include: { areas: { orderBy: { name: "asc" } } },
  });
}

export async function getAreaBySlugs(citySlug: string, areaSlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) return null;
  const area = await prisma.area.findUnique({
    where: { cityId_slug: { cityId: city.id, slug: areaSlug } },
    include: { city: true },
  });
  return area;
}

export async function listLandmarks(cityId?: string) {
  return prisma.landmark.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { name: "asc" },
  });
}

export { scoreAreaMatch };

export type AreaSuggestion = {
  id: string;
  name: string;
  slug: string;
  cityName: string;
  citySlug: string;
  score: number;
  href: string;
};

async function scoredAreas(query: string): Promise<AreaSuggestion[]> {
  const q = normalizeQuery(query);
  if (!q) return [];

  const cities = await listCities();
  const matches: AreaSuggestion[] = [];

  for (const city of cities) {
    for (const area of city.areas) {
      const score = scoreAreaMatch(q, area.name);
      if (score <= 0) continue;
      matches.push({
        id: area.id,
        name: area.name,
        slug: area.slug,
        cityName: city.name,
        citySlug: city.slug,
        score,
        href: `/pgs/${city.slug}/${area.slug}`,
      });
    }
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  return matches;
}

export async function suggestAreas(query: string, limit = 8) {
  const matches = await scoredAreas(query);
  return matches.slice(0, limit);
}

/** All matching areas for free-text PG search ranking. */
export async function matchAreasForQuery(query: string) {
  return scoredAreas(query);
}

async function loadNearbyForArea(areaId: string): Promise<{
  areaName: string;
  places: NearbyPlace[];
} | null> {
  const area = await prisma.area.findUnique({
    where: { id: areaId },
    select: { id: true, name: true, latitude: true, longitude: true },
  });
  if (!area?.latitude || area.longitude == null) return null;

  try {
    const places = await fetchNearbyPlaces({
      lat: area.latitude,
      lng: area.longitude,
    });
    if (!places.length) return null;
    return { areaName: area.name, places };
  } catch {
    return null;
  }
}

/** Cached nearby places for an area (6h). Returns null if unavailable. */
export async function getNearbyForArea(areaId: string) {
  return unstable_cache(
    () => loadNearbyForArea(areaId),
    ["nearby-places", areaId],
    { revalidate: 21600 },
  )();
}
