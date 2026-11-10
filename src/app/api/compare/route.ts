import { PropertyStatus } from "@prisma/client";
import { z } from "zod";
import { fillCommuteQuotes } from "@/modules/commute";
import { parseCommuteMode } from "@/lib/commute/modes";
import { COMPARE_LIMIT } from "@/lib/constants";
import { handleRouteError, jsonOk } from "@/lib/http";
import type { ComparePg } from "@/lib/match-score";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  slugs: z
    .string()
    .transform((value) => [...new Set(value.split(",").map((s) => s.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(200)).min(1).max(COMPARE_LIMIT)),
  destLat: z.coerce.number().min(-90).max(90).optional(),
  destLng: z.coerce.number().min(-180).max(180).optional(),
  mode: z.string().default("metro"),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({
      slugs: url.searchParams.get("slugs") ?? "",
      destLat: url.searchParams.get("destLat") || undefined,
      destLng: url.searchParams.get("destLng") || undefined,
      mode: url.searchParams.get("mode") || undefined,
    });

    const rows = await prisma.property.findMany({
      where: { slug: { in: query.slugs }, status: PropertyStatus.PUBLISHED },
      include: {
        city: { select: { name: true } },
        area: { select: { name: true } },
        photos: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        amenities: { include: { amenity: { select: { slug: true, name: true } } } },
        roomTypes: { orderBy: { rent: "asc" } },
      },
    });

    const hasOrigin = query.destLat != null && query.destLng != null;
    const commutes = hasOrigin
      ? await fillCommuteQuotes(
          rows.map((row) => ({
            id: row.id,
            lat: row.latitude,
            lng: row.longitude,
            rent: row.minRent,
          })),
          {
            destLat: query.destLat!,
            destLng: query.destLng!,
            mode: parseCommuteMode(query.mode),
          },
        )
      : null;

    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    const properties: ComparePg[] = query.slugs.flatMap((slug) => {
      const row = bySlug.get(slug);
      if (!row) return [];
      const commute = commutes?.get(row.id) ?? null;
      return [
        {
          id: row.id,
          slug: row.slug,
          name: row.name,
          pgType: row.pgType,
          address: row.address,
          areaName: row.area.name,
          cityName: row.city.name,
          latitude: row.latitude,
          longitude: row.longitude,
          photo: row.photos[0]?.url ?? null,
          minRent: row.minRent,
          minDeposit: row.minDeposit,
          maintenanceCharge: row.maintenanceCharge,
          electricityNote: row.electricityNote,
          availableBeds: row.availableBeds,
          totalBeds: row.totalBeds,
          roomTypes: row.roomTypes.map((rt) => ({
            sharingType: rt.sharingType,
            rent: rt.rent,
            deposit: rt.deposit,
            availableBeds: rt.availableBeds,
            totalBeds: rt.totalBeds,
          })),
          foodIncluded: row.foodIncluded,
          vegetarianFood: row.vegetarianFood,
          nonVegetarianFood: row.nonVegetarianFood,
          mealsProvided: row.mealsProvided,
          amenities: row.amenities.map((a) => ({ slug: a.amenity.slug, name: a.amenity.name })),
          smokingAllowed: row.smokingAllowed,
          visitorsAllowed: row.visitorsAllowed,
          cookingAllowed: row.cookingAllowed,
          alcoholAllowed: row.alcoholAllowed,
          gateClosingTime: row.gateClosingTime,
          noticePeriodDays: row.noticePeriodDays,
          lockInMonths: row.lockInMonths,
          ratingAvg: row.ratingAvg,
          reviewCount: row.reviewCount,
          verificationLevel: row.verificationLevel,
          moveInFrom: row.moveInFrom?.toISOString() ?? null,
          availabilityConfirmedAt: row.availabilityConfirmedAt.toISOString(),
          livabilityScore: row.livabilityScore,
          safetyScore: row.safetyScore,
          commute: commute
            ? {
                distanceKm: commute.selected.km,
                minutes: commute.selected.minutes,
                mode: commute.selected.mode,
                fromRoute: commute.selected.fromRoute,
                trueMonthlyCost: commute.trueMonthlyCost,
                quotes: commute.quotes,
              }
            : null,
        },
      ];
    });

    return jsonOk({ properties });
  } catch (error) {
    return handleRouteError(error);
  }
}
