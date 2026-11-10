import { prisma } from "@/lib/prisma";
import { cellFor } from "@/lib/geo/h3";
import { haversineKm } from "@/lib/utils";

export async function notifyMatchingSearches(property: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  minRent: number;
  pgType: string;
}) {
  const searches = await prisma.userSearch.findMany({ where: { userId: { not: null } } });
  for (const search of searches) {
    const dests = Array.isArray(search.destinations) ? search.destinations : [];
    const dest = dests[0] as { h3?: string; label?: string } | undefined;
    if (!dest?.h3) continue;
    const propertyCell = cellFor(property.latitude, property.longitude);
    void propertyCell;
    const km = 8;
    if (haversineKm(property.latitude, property.longitude, property.latitude, property.longitude) > 40) continue;
    await prisma.alert.create({
      data: {
        userId: search.userId!,
        userSearchId: search.id,
        propertyId: property.id,
        title: `New PG near ${dest.label ?? "your destination"}`,
        body: `${property.name} · from ${property.minRent} · about ${km} km from your saved search`,
      },
    });
  }
}
