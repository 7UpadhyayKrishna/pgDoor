import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { fetchNearbyPlaces, type NearbyPlace } from "@/lib/places";

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

function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Higher is better: exact 100, starts-with 80, word-prefix 60, contains 40. */
export function scoreAreaMatch(query: string, areaName: string) {
  const q = normalizeQuery(query);
  if (!q) return 0;
  const name = normalizeQuery(areaName);
  if (!name) return 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  const words = name.split(" ");
  if (words.some((w) => w.startsWith(q))) return 60;
  if (name.includes(q)) return 40;
  return 0;
}

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
