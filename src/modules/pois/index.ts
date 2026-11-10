import { PoiCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/utils";
import { fetchMapLayerPois } from "@/lib/places";

const CATEGORY_LAYERS: { category: PoiCategory; layer: "transport" | "daily" | "lifestyle" | "essentials" }[] = [
  { category: "METRO", layer: "transport" },
  { category: "FOOD", layer: "daily" },
  { category: "GROCERY", layer: "daily" },
  { category: "CAFE", layer: "daily" },
  { category: "GYM", layer: "lifestyle" },
  { category: "HOSPITAL", layer: "essentials" },
];

function minutesWalk(km: number) {
  return Math.max(1, Math.round((km / 5) * 60));
}

export async function nearbyForProperty(propertyId: string, lat: number, lng: number) {
  const existing = await prisma.propertyPoi.findMany({
    where: { propertyId },
    include: { poi: true },
    take: 40,
  });
  if (existing.length >= 8) {
    return existing.map((row) => ({
      id: row.poi.id,
      name: row.poi.name,
      category: row.poi.category,
      walkingMinutes: row.walkingMinutes,
      rating: row.poi.rating,
      latitude: row.poi.latitude,
      longitude: row.poi.longitude,
    }));
  }

  const pois = await fetchMapLayerPois({
    lat,
    lng,
    layers: ["transport", "daily", "lifestyle", "essentials"],
    radiusMeters: 1500,
  });

  const mapped = pois.map((poi) => {
    const category: PoiCategory =
      poi.layer === "transport"
        ? "METRO"
        : poi.layer === "essentials"
          ? "HOSPITAL"
          : poi.layer === "lifestyle"
            ? "GYM"
            : /gym|laundry/i.test(poi.name)
              ? "GYM"
              : /atm/i.test(poi.name)
                ? "ATM"
                : /groc|kirana|mart/i.test(poi.name)
                  ? "GROCERY"
                  : /cafe/i.test(poi.name)
                    ? "CAFE"
                    : "FOOD";
    return {
      ...poi,
      category,
      walkingMinutes: minutesWalk(haversineKm(lat, lng, poi.latitude, poi.longitude)),
    };
  });

  for (const poi of mapped) {
    const row = await prisma.poi.upsert({
      where: { osmOrPlaceId: poi.placeId },
      update: { name: poi.name, rating: undefined },
      create: {
        osmOrPlaceId: poi.placeId,
        name: poi.name,
        category: poi.category,
        latitude: poi.latitude,
        longitude: poi.longitude,
        source: "places",
      },
    });
    await prisma.propertyPoi.upsert({
      where: { propertyId_poiId: { propertyId, poiId: row.id } },
      update: { walkingMinutes: poi.walkingMinutes },
      create: { propertyId, poiId: row.id, walkingMinutes: poi.walkingMinutes },
    });
  }

  const grouped = new Map<string, typeof mapped>();
  for (const poi of mapped) {
    const list = grouped.get(poi.category) ?? [];
    if (list.length < 3) list.push(poi);
    grouped.set(poi.category, list);
  }
  return [...grouped.values()].flat().map((poi) => ({
    id: poi.placeId,
    name: poi.name,
    category: poi.category,
    walkingMinutes: poi.walkingMinutes,
    rating: undefined as number | undefined,
    latitude: poi.latitude,
    longitude: poi.longitude,
  }));
}

export { CATEGORY_LAYERS };
