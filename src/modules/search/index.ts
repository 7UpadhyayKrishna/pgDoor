import { z } from "zod";
import { unstable_cache } from "next/cache";
import {
  PgType,
  Prisma,
  PropertyStatus,
  RoomSharingType,
  VerificationLevel,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haversineKm, slugify } from "@/lib/utils";
import { generateFromCounts, type RoomSpec } from "@/modules/inventory";
import { HttpError } from "@/lib/rbac";
import { isAllowedPhotoUrl } from "@/lib/storage";
import { SEARCH_PAGE_SIZE } from "@/lib/constants";
import { matchAreasForQuery } from "@/modules/locations";
import {
  estimateRadiusKm,
  parseBounds,
  type TravelMode,
} from "@/lib/commute";
import { bboxForRadiusKm, cellFor } from "@/lib/geo/h3";
import { parseCommuteMode } from "@/lib/commute/modes";
import { parseArrivalTime } from "@/lib/commute/time";
import {
  cardFromCommute,
  fillCommuteQuotes,
  rankProperties,
  type PropertyCommute,
} from "@/modules/commute";

export const searchFiltersSchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  q: z.string().optional(),
  budgetMax: z.coerce.number().optional(),
  budgetMin: z.coerce.number().optional(),
  sharing: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR"]).optional(),
  pgType: z.enum(["BOYS", "GIRLS", "CO_LIVING", "UNISEX"]).optional(),
  amenities: z.array(z.string()).optional(),
  food: z.enum(["true", "false"]).optional(),
  vegetarianFood: z.enum(["true", "false"]).optional(),
  smokingAllowed: z.enum(["true", "false"]).optional(),
  visitorsAllowed: z.enum(["true", "false"]).optional(),
  cookingAllowed: z.enum(["true", "false"]).optional(),
  availability: z.enum(["now", "week", "date"]).optional(),
  availableFrom: z.string().optional(),
  sort: z
    .enum([
      "relevance",
      "rent",
      "rent_desc",
      "rating",
      "newest",
      "freshness",
      "commute",
      "true_cost",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  featured: z.enum(["true", "false"]).optional(),
  near: z.string().optional(),
  destLat: z.coerce.number().optional(),
  destLng: z.coerce.number().optional(),
  destLabel: z.string().optional(),
  commuteMax: z.coerce.number().int().positive().optional(),
  maxDailyCost: z.coerce.number().int().min(0).optional(),
  arrivalTime: z.string().optional(),
  commuteDays: z.coerce.number().int().min(1).max(31).optional(),
  slot: z.enum(["peak", "offpeak"]).optional(),
  rankingStyle: z.enum(["weighted", "fair"]).optional(),
  dests: z.string().optional(),
  metroLine: z.string().optional(),
  mode: z.string().optional(),
  radiusKm: z.coerce.number().positive().optional(),
  /** south,west,north,east */
  bounds: z.string().optional(),
});

const VERIFICATION_RANK: Record<VerificationLevel, number> = {
  UNVERIFIED: 0,
  OWNER_VERIFIED: 1,
  PROPERTY_VERIFIED: 2,
  PGDOOR_VERIFIED: 3,
};

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

const publicInclude = {
  city: true,
  area: true,
  photos: { orderBy: { sortOrder: "asc" as const }, take: 4 },
  amenities: { include: { amenity: true } },
  roomTypes: { orderBy: { rent: "asc" as const } },
} satisfies Prisma.PropertyInclude;

/** Minimal include for listing cards (homepage / search grids). */
const cardInclude = {
  city: { select: { name: true, slug: true } },
  area: { select: { name: true, slug: true } },
  photos: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  roomTypes: {
    orderBy: { rent: "asc" as const },
    take: 1,
    select: {
      sharingType: true,
      rent: true,
      deposit: true,
      availableBeds: true,
      totalBeds: true,
    },
  },
} satisfies Prisma.PropertyInclude;

/** Upper bound on pins sent to the explore map; the list itself stays paginated. */
const MAP_PIN_LIMIT = 2000;

/** Ranking/geo filter payload — full card fields are loaded only for the current page. */
const commuteRankSelect = {
  id: true,
  slug: true,
  name: true,
  latitude: true,
  longitude: true,
  minRent: true,
  pgType: true,
  featured: true,
  ratingAvg: true,
  verificationLevel: true,
  availabilityConfirmedAt: true,
  city: { select: { name: true } },
  area: { select: { name: true } },
  photos: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.PropertySelect;

const pinSelect = {
  id: true,
  slug: true,
  name: true,
  latitude: true,
  longitude: true,
  minRent: true,
  pgType: true,
  city: { select: { name: true } },
  area: { select: { name: true } },
  photos: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.PropertySelect;

export type MapPin = {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  minRent: number;
  pgType: PgType;
  areaName: string;
  cityName: string;
  photo: string | null;
  commuteText: string | null;
  commuteMinutes: number | null;
  distanceKm: number | null;
  trueMonthlyCost: number | null;
  approximate: boolean;
};

function toMapPin(
  row: {
    id: string;
    slug: string;
    name: string;
    latitude: number;
    longitude: number;
    minRent: number;
    pgType: PgType;
    city: { name: string };
    area: { name: string };
    photos: { url: string }[];
  },
  commute?: {
    text: string;
    minutes: number | null;
    distanceKm: number;
    trueMonthlyCost?: number;
    approximate?: boolean;
  } | null,
): MapPin {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    minRent: row.minRent,
    pgType: row.pgType,
    areaName: row.area.name,
    cityName: row.city.name,
    photo: row.photos[0]?.url ?? null,
    commuteText: commute?.text ?? null,
    commuteMinutes: commute?.minutes ?? null,
    distanceKm: commute?.distanceKm ?? null,
    trueMonthlyCost: commute?.trueMonthlyCost ?? null,
    approximate: commute?.approximate ?? false,
  };
}

export type CardCommute = {
  minutes: number | null;
  distanceKm: number;
  text: string;
  mode: string;
  fromRoute: boolean;
  trueMonthlyCost?: number;
  monthlyCommute?: number;
  dailyCost?: number;
  oneWayCost?: number;
  approximate?: boolean;
  computedAt?: string;
  cheapest?: boolean;
  fastest?: boolean;
  recommended?: boolean;
};

export function toPublicCard(
  property: {
    id: string;
    slug: string;
    name: string;
    pgType: PgType;
    address: string;
    city: { name: string; slug: string };
    area: { name: string; slug: string };
    latitude: number;
    longitude: number;
    minRent: number;
    minDeposit: number;
    availableBeds: number;
    totalBeds: number;
    foodIncluded: boolean;
    verificationLevel: VerificationLevel;
    featured: boolean;
    ratingAvg: number;
    reviewCount: number;
    availabilityUpdatedAt: Date;
    availabilityConfirmedAt: Date;
    moveInFrom: Date | null;
    photos: { url: string; alt: string | null }[];
    amenities?: { amenity: { name: string; slug: string; group: string } }[];
    roomTypes: {
      sharingType: RoomSharingType;
      rent: number;
      deposit: number;
      availableBeds: number;
      totalBeds: number;
    }[];
    livabilityScore?: number | null;
    safetyScore?: number | null;
    commuteBadges?: string[];
    tourVideoUrl?: string | null;
  },
  commute?: CardCommute | null,
) {
  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    pgType: property.pgType,
    address: property.address,
    city: { name: property.city.name, slug: property.city.slug },
    area: { name: property.area.name, slug: property.area.slug },
    latitude: property.latitude,
    longitude: property.longitude,
    minRent: property.minRent,
    minDeposit: property.minDeposit,
    availableBeds: property.availableBeds,
    totalBeds: property.totalBeds,
    foodIncluded: property.foodIncluded,
    verificationLevel: property.verificationLevel,
    featured: property.featured,
    ratingAvg: property.ratingAvg,
    reviewCount: property.reviewCount,
    availabilityUpdatedAt: property.availabilityUpdatedAt,
    availabilityConfirmedAt: property.availabilityConfirmedAt,
    moveInFrom: property.moveInFrom,
    photos: property.photos.map((photo) => ({
      url: photo.url,
      alt: photo.alt ?? property.name,
    })),
    amenities: (property.amenities ?? []).map((row) => ({
      name: row.amenity.name,
      slug: row.amenity.slug,
      group: row.amenity.group,
    })),
    roomTypes: property.roomTypes.map((rt) => ({
      sharingType: rt.sharingType,
      rent: rt.rent,
      deposit: rt.deposit,
      availableBeds: rt.availableBeds,
      totalBeds: rt.totalBeds,
    })),
    commute: commute ?? null,
    livabilityScore: property.livabilityScore ?? null,
    safetyScore: property.safetyScore ?? null,
    commuteBadges: property.commuteBadges ?? [],
    tourVideoUrl: property.tourVideoUrl ?? null,
  };
}

function parseExtraDests(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 3)
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as { lat?: number; lng?: number; tripsPerWeek?: number; weight?: number };
        if (typeof row.lat !== "number" || typeof row.lng !== "number") return [];
        return [
          {
            lat: row.lat,
            lng: row.lng,
            tripsPerWeek: row.tripsPerWeek ?? 5,
            weight: row.weight ?? 1,
          },
        ];
      });
  } catch {
    return [];
  }
}

function applyNonGeoFilters(
  where: Prisma.PropertyWhereInput,
  filters: SearchFilters,
) {
  if (filters.budgetMax) {
    where.minRent = { ...(where.minRent as object), lte: filters.budgetMax };
  }
  if (filters.budgetMin) {
    where.minRent = { ...(where.minRent as object), gte: filters.budgetMin };
  }
  if (filters.pgType) {
    where.pgType = filters.pgType as PgType;
  }
  if (filters.sharing) {
    where.roomTypes = {
      some: {
        sharingType: filters.sharing as RoomSharingType,
        availableBeds: { gt: 0 },
      },
    };
  }
  if (filters.amenities?.length) {
    where.AND = (where.AND as Prisma.PropertyWhereInput[] | undefined) ?? [];
    (where.AND as Prisma.PropertyWhereInput[]).push(
      ...filters.amenities.map((slug) => ({
        amenities: { some: { amenity: { slug } } },
      })),
    );
  }
  if (filters.food === "true") where.foodIncluded = true;
  if (filters.vegetarianFood === "true") where.vegetarianFood = true;
  if (filters.smokingAllowed === "true") where.smokingAllowed = true;
  if (filters.visitorsAllowed === "true") where.visitorsAllowed = true;
  if (filters.cookingAllowed === "true") where.cookingAllowed = true;

  if (filters.availability === "now") {
    where.availableBeds = { gt: 0 };
    where.OR = [{ moveInFrom: null }, { moveInFrom: { lte: new Date() } }];
  }
  if (filters.availability === "week") {
    const week = new Date();
    week.setDate(week.getDate() + 7);
    where.availableBeds = { gt: 0 };
    where.OR = [{ moveInFrom: null }, { moveInFrom: { lte: week } }];
  }
  if (filters.availableFrom) {
    const date = new Date(filters.availableFrom);
    if (!Number.isNaN(date.getTime())) {
      where.availableBeds = { gt: 0 };
      where.OR = [{ moveInFrom: null }, { moveInFrom: { lte: date } }];
    }
  }
}

function sortByRelevance(
  a: {
    areaId: string;
    featured: boolean;
    verificationLevel: VerificationLevel;
    availabilityConfirmedAt: Date;
    ratingAvg: number;
  },
  b: typeof a,
  areaScores: Map<string, number>,
) {
  const scoreA = areaScores.get(a.areaId) ?? 0;
  const scoreB = areaScores.get(b.areaId) ?? 0;
  if (scoreB !== scoreA) return scoreB - scoreA;
  if (Number(b.featured) !== Number(a.featured)) {
    return Number(b.featured) - Number(a.featured);
  }
  const verDiff =
    VERIFICATION_RANK[b.verificationLevel] - VERIFICATION_RANK[a.verificationLevel];
  if (verDiff !== 0) return verDiff;
  const availDiff =
    b.availabilityConfirmedAt.getTime() - a.availabilityConfirmedAt.getTime();
  if (availDiff !== 0) return availDiff;
  return b.ratingAvg - a.ratingAvg;
}

export async function searchProperties(filters: SearchFilters) {
  const page = filters.page ?? 1;
  const where: Prisma.PropertyWhereInput = {
    status: PropertyStatus.PUBLISHED,
  };

  const q = filters.q?.trim();
  let areaScores = new Map<string, number>();
  const destLat = filters.destLat;
  const destLng = filters.destLng;
  const hasDestination =
    typeof destLat === "number" &&
    typeof destLng === "number" &&
    !Number.isNaN(destLat) &&
    !Number.isNaN(destLng);
  const productMode = parseCommuteMode(filters.mode);
  const mode: TravelMode =
    productMode === "walk"
      ? "walking"
      : productMode === "cycle" || productMode === "rapido"
        ? "bicycling"
        : productMode === "auto" || productMode === "cab" || productMode === "own_vehicle"
          ? "driving"
          : "transit";
  const bounds = parseBounds(filters.bounds);

  // "near" alias: "lat,lng" string
  let nearLat = destLat;
  let nearLng = destLng;
  if (!hasDestination && filters.near) {
    const parts = filters.near.split(",").map(Number);
    if (parts.length === 2 && parts.every((n) => !Number.isNaN(n))) {
      nearLat = parts[0];
      nearLng = parts[1];
    }
  }
  const useGeo =
    (typeof nearLat === "number" &&
      typeof nearLng === "number" &&
      !Number.isNaN(nearLat) &&
      !Number.isNaN(nearLng)) ||
    Boolean(bounds);

  if (q && !useGeo) {
    const matched = await matchAreasForQuery(q);
    if (matched.length === 0) {
      return {
        total: 0,
        page,
        pageSize: SEARCH_PAGE_SIZE,
        results: [],
        pins: [] as MapPin[],
        destination: null as null | {
          lat: number;
          lng: number;
          label?: string;
          mode: TravelMode;
        },
      };
    }
    areaScores = new Map(matched.map((a) => [a.id, a.score]));
    where.areaId = { in: matched.map((a) => a.id) };
  } else if (!useGeo) {
    if (filters.city) {
      where.city = { slug: filters.city };
    }
    if (filters.area) {
      where.area = { slug: filters.area };
    }
  } else {
    // Still allow city narrowing when searching by destination
    if (filters.city) {
      where.city = { slug: filters.city };
    }
  }

  applyNonGeoFilters(where, filters);

  const destinationMeta =
    typeof nearLat === "number" && typeof nearLng === "number"
      ? {
          lat: nearLat,
          lng: nearLng,
          label: filters.destLabel,
          mode,
        }
      : null;

  const useAreaRelevance =
    Boolean(q) && !useGeo && (!filters.sort || filters.sort === "relevance");
  const useCommutePath =
    useGeo ||
    filters.sort === "commute" ||
    Boolean(filters.commuteMax);

  let orderBy: Prisma.PropertyOrderByWithRelationInput[] = [
    { featured: "desc" },
    { verificationLevel: "desc" },
    { availabilityConfirmedAt: "desc" },
    { ratingAvg: "desc" },
  ];
  if (filters.sort === "rent") orderBy = [{ minRent: "asc" }];
  if (filters.sort === "rent_desc") orderBy = [{ minRent: "desc" }];
  if (filters.sort === "rating") orderBy = [{ ratingAvg: "desc" }];
  if (filters.sort === "newest") orderBy = [{ publishedAt: "desc" }];
  if (filters.sort === "freshness") orderBy = [{ availabilityConfirmedAt: "desc" }];

  if (useAreaRelevance) {
    const rows = await prisma.property.findMany({
      where,
      include: cardInclude,
    });

    rows.sort((a, b) => sortByRelevance(a, b, areaScores));

    const total = rows.length;
    const pageRows = rows.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);

    return {
      total,
      page,
      pageSize: SEARCH_PAGE_SIZE,
      results: pageRows.map((row) => toPublicCard(row)),
      pins: rows.slice(0, MAP_PIN_LIMIT).map((row) => toMapPin(row)),
      destination: destinationMeta,
    };
  }

  if (useCommutePath && typeof nearLat === "number" && typeof nearLng === "number") {
    const radiusKm = filters.radiusKm ?? estimateRadiusKm(filters.commuteMax, mode);
    const box = bounds ?? bboxForRadiusKm(nearLat, nearLng, radiusKm);
    where.latitude = { gte: box.south, lte: box.north };
    where.longitude = { gte: box.west, lte: box.east };

    let rows = await prisma.property.findMany({
      where,
      select: commuteRankSelect,
    });

    rows = rows.filter(
      (p) => haversineKm(p.latitude, p.longitude, nearLat, nearLng) <= radiusKm,
    );

    const extraDests = parseExtraDests(filters.dests);
    const commutes = await fillCommuteQuotes(
      rows.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, rent: p.minRent })),
      {
        destLat: nearLat,
        destLng: nearLng,
        destLabel: filters.destLabel,
        mode: productMode,
        slot: filters.slot ?? "peak",
        arrivalTime: parseArrivalTime(filters.arrivalTime),
        commuteDays: filters.commuteDays ?? 22,
        maxMinutes: filters.commuteMax,
        maxDailyCost: filters.maxDailyCost,
        extraDests,
        rankingStyle: filters.rankingStyle,
      },
    );

    let enriched = rows.map((row) => ({
      row,
      profile: commutes.get(row.id) ?? null,
    }));

    if (filters.commuteMax) {
      enriched = enriched.filter((item) => {
        const selected = item.profile?.selected;
        if (!selected) return false;
        return selected.minutes <= filters.commuteMax!;
      });
    }
    if (filters.maxDailyCost != null) {
      enriched = enriched.filter((item) => {
        const selected = item.profile?.selected;
        if (!selected) return false;
        return selected.dailyCost <= filters.maxDailyCost!;
      });
    }

    const sortMode = filters.sort ?? (useGeo ? "true_cost" : "relevance");
    if (sortMode === "true_cost" || sortMode === "relevance" || sortMode === "commute") {
      if (sortMode === "commute") {
        enriched.sort((a, b) => {
          const minA = a.profile?.selected.minutes ?? Number.POSITIVE_INFINITY;
          const minB = b.profile?.selected.minutes ?? Number.POSITIVE_INFINITY;
          return minA - minB;
        });
      } else {
        const ranked = rankProperties(
          enriched.map((item) => item.row),
          new Map(
            enriched.flatMap((item) =>
              item.profile ? [[item.row.id, item.profile] as [string, PropertyCommute]] : [],
            ),
          ),
        );
        const order = new Map(ranked.map((row, index) => [row.id, index]));
        enriched.sort((a, b) => (order.get(a.row.id) ?? 0) - (order.get(b.row.id) ?? 0));
        if (sortMode === "true_cost") {
          enriched.sort(
            (a, b) =>
              (a.profile?.trueMonthlyCost ?? a.row.minRent) -
              (b.profile?.trueMonthlyCost ?? b.row.minRent),
          );
        }
      }
    } else if (sortMode === "rent") {
      enriched.sort((a, b) => a.row.minRent - b.row.minRent);
    } else if (sortMode === "rent_desc") {
      enriched.sort((a, b) => b.row.minRent - a.row.minRent);
    } else if (sortMode === "rating") {
      enriched.sort((a, b) => b.row.ratingAvg - a.row.ratingAvg);
    } else if (sortMode === "freshness") {
      enriched.sort(
        (a, b) =>
          b.row.availabilityConfirmedAt.getTime() - a.row.availabilityConfirmedAt.getTime(),
      );
    }

    const featured = enriched.filter((item) => item.row.featured);
    const organic = enriched.filter((item) => !item.row.featured);
    const ordered = [...organic];
    if (featured.length) {
      ordered.splice(Math.min(2, ordered.length), 0, ...featured.slice(0, 1));
    }

    const total = ordered.length;
    const pageRows = ordered.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);
    const cardCommute = (profile: PropertyCommute | null) =>
      profile ? cardFromCommute(profile) : null;
    const pageIds = pageRows.map((item) => item.row.id);
    const fullRows =
      pageIds.length === 0
        ? []
        : await prisma.property.findMany({
            where: { id: { in: pageIds } },
            include: cardInclude,
          });
    const fullById = new Map(fullRows.map((row) => [row.id, row]));

    return {
      total,
      page,
      pageSize: SEARCH_PAGE_SIZE,
      results: pageRows.flatMap((item) => {
        const full = fullById.get(item.row.id);
        return full ? [toPublicCard(full, cardCommute(item.profile))] : [];
      }),
      pins: ordered.slice(0, MAP_PIN_LIMIT).map((item) => toMapPin(item.row, cardCommute(item.profile))),
      destination: {
        ...destinationMeta!,
        mode: productMode,
        slot: filters.slot ?? "peak",
        arrivalTime: parseArrivalTime(filters.arrivalTime),
      },
    };
  }

  // Bounds-only search (pan map without destination)
  if (bounds) {
    let rows = await prisma.property.findMany({
      where,
      include: cardInclude,
      orderBy,
    });
    rows = rows.filter(
      (p) =>
        p.latitude >= bounds.south &&
        p.latitude <= bounds.north &&
        p.longitude >= bounds.west &&
        p.longitude <= bounds.east,
    );
    const total = rows.length;
    const pageRows = rows.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);
    return {
      total,
      page,
      pageSize: SEARCH_PAGE_SIZE,
      results: pageRows.map((row) => toPublicCard(row)),
      pins: rows.slice(0, MAP_PIN_LIMIT).map((row) => toMapPin(row)),
      destination: destinationMeta,
    };
  }

  const [total, rows, pinRows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (page - 1) * SEARCH_PAGE_SIZE,
      take: SEARCH_PAGE_SIZE,
    }),
    prisma.property.findMany({
      where,
      select: pinSelect,
      orderBy,
      take: MAP_PIN_LIMIT,
    }),
  ]);

  return {
    total,
    page,
    pageSize: SEARCH_PAGE_SIZE,
    results: rows.map((row) => toPublicCard(row)),
    pins: pinRows.map((row) => toMapPin(row)),
    destination: destinationMeta,
  };
}

export async function getPublishedBySlug(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      ...publicInclude,
      photos: { orderBy: { sortOrder: "asc" } },
      reviews: {
        include: { scores: true, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      verificationChecks: true,
    },
  });
  if (!property || property.status !== "PUBLISHED") return null;
  return property;
}

export async function getFeatured(limit = 8) {
  const rows = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
    take: limit,
  });
  return rows.map((row) => toPublicCard(row));
}

export const getCachedFeatured = unstable_cache(
  async (limit = 8) => getFeatured(limit),
  ["featured-pgs"],
  { revalidate: 60 },
);

export async function uniqueSlug(name: string, areaName: string, cityName: string) {
  const base = slugify(`${name} ${areaName} ${cityName}`);
  let slug = base;
  let i = 2;
  while (await prisma.property.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

const MEALS = ["BREAKFAST", "LUNCH", "DINNER"] as const;
/** The database is far from the app server, so a listing save can take well over Prisma's 5s default. */
const LISTING_TX_OPTIONS = { maxWait: 10_000, timeout: 30_000 };
const MAX_PHOTOS = 20;

export const createPropertySchema = z.object({
  name: z.string().trim().min(3, "PG name must be at least 3 characters").max(120),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().min(5, "Add the full address").max(500),
  cityId: z.string(),
  areaId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  pgType: z.enum(["BOYS", "GIRLS", "CO_LIVING", "UNISEX"]),
  preferredTenants: z.enum(["ANY", "STUDENTS", "PROFESSIONALS"]).default("ANY"),
  foodIncluded: z.boolean().optional(),
  mealsProvided: z.array(z.enum(MEALS)).default([]),
  maintenanceCharge: z.number().int().nonnegative().optional(),
  electricityNote: z.string().trim().max(120).optional(),
  vegetarianFood: z.boolean().optional(),
  nonVegetarianFood: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  alcoholAllowed: z.boolean().optional(),
  visitorsAllowed: z.boolean().optional(),
  cookingAllowed: z.boolean().optional(),
  gateClosingTime: z.string().trim().max(20).optional(),
  noticePeriodDays: z.number().int().min(0).max(180).optional(),
  lockInMonths: z.number().int().min(0).max(24).optional(),
  moveInFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .optional(),
  contactName: z.string().trim().max(80).optional(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional(),
  amenitySlugs: z.array(z.string()).default([]),
  otherAmenities: z.string().trim().max(500).optional(),
  rooms: z
    .array(
      z.object({
        sharingType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR"]),
        rent: z.number().int().positive("Rent must be more than 0"),
        deposit: z.number().int().nonnegative(),
        roomCount: z.number().int().positive("Add at least 1 room"),
        availableBeds: z.number().int().nonnegative(),
      }),
    )
    .min(1, "Add at least one room type"),
  photoUrls: z
    .array(z.string().min(1))
    .min(1, "Add at least one photo")
    .max(MAX_PHOTOS, `You can add up to ${MAX_PHOTOS} photos`),
});

export type ListingInput = z.infer<typeof createPropertySchema>;

async function resolveLocation(input: ListingInput) {
  const [city, area] = await Promise.all([
    prisma.city.findUnique({ where: { id: input.cityId } }),
    prisma.area.findUnique({ where: { id: input.areaId } }),
  ]);
  if (!city || !area || area.cityId !== city.id) {
    throw new HttpError(400, "Pick a valid city and area");
  }
  return { city, area };
}

function assertPhotoUrls(urls: string[], alreadyAttached: string[] = []) {
  const bad = urls.find((url) => !alreadyAttached.includes(url) && !isAllowedPhotoUrl(url));
  if (bad) throw new HttpError(400, "One of the photos was not uploaded correctly. Please re-upload it.");
}

function listingFields(input: ListingInput) {
  const foodIncluded = input.foodIncluded ?? false;
  return {
    name: input.name,
    description: input.description || null,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    h3Cell: cellFor(input.latitude, input.longitude),
    pgType: input.pgType,
    preferredTenants: input.preferredTenants,
    foodIncluded,
    mealsProvided: foodIncluded ? input.mealsProvided : [],
    vegetarianFood: foodIncluded && (input.vegetarianFood ?? false),
    nonVegetarianFood: foodIncluded && (input.nonVegetarianFood ?? false),
    maintenanceCharge: input.maintenanceCharge ?? null,
    electricityNote: input.electricityNote || null,
    smokingAllowed: input.smokingAllowed ?? false,
    alcoholAllowed: input.alcoholAllowed ?? false,
    visitorsAllowed: input.visitorsAllowed ?? false,
    cookingAllowed: input.cookingAllowed ?? false,
    gateClosingTime: input.gateClosingTime || null,
    noticePeriodDays: input.noticePeriodDays ?? null,
    lockInMonths: input.lockInMonths ?? null,
    moveInFrom: input.moveInFrom ? new Date(`${input.moveInFrom}T00:00:00+05:30`) : null,
    contactName: input.contactName || null,
    contactPhone: input.contactPhone || null,
    otherAmenities: input.otherAmenities || null,
  };
}

async function amenityIds(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await prisma.amenity.findMany({ where: { slug: { in: slugs } } });
  return rows.map((row) => row.id);
}

export async function createListing(ownerProfileId: string, input: ListingInput) {
  const { city, area } = await resolveLocation(input);
  assertPhotoUrls(input.photoUrls);

  const slug = await uniqueSlug(input.name, area.name, city.name);
  const amenities = await amenityIds(input.amenitySlugs);

  const property = await prisma.$transaction(async (tx) => {
    const created = await tx.property.create({
      data: {
        ...listingFields(input),
        ownerId: ownerProfileId,
        slug,
        cityId: city.id,
        areaId: area.id,
        status: "PENDING_REVIEW",
        amenities: {
          create: amenities.map((amenityId) => ({ amenityId })),
        },
        photos: {
          create: input.photoUrls.map((url, index) => ({
            url,
            sortOrder: index,
            alt: input.name,
          })),
        },
      },
    });

    await generateFromCounts(created.id, input.rooms as RoomSpec[], tx);
    return created;
  }, LISTING_TX_OPTIONS);

  return prisma.property.findUniqueOrThrow({
    where: { id: property.id },
    include: publicInclude,
  });
}

export async function getOwnerProperty(ownerProfileId: string | null, propertyId: string, isAdmin = false) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      city: true,
      area: true,
      photos: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
      roomTypes: { include: { rooms: { select: { id: true } } } },
    },
  });
  if (!property || (!isAdmin && property.ownerId !== ownerProfileId)) {
    throw new HttpError(404, "Listing not found");
  }
  return property;
}

export async function updateListing(
  ownerProfileId: string | null,
  propertyId: string,
  input: ListingInput,
  isAdmin = false,
) {
  const existing = await getOwnerProperty(ownerProfileId, propertyId, isAdmin);
  const { city, area } = await resolveLocation(input);
  assertPhotoUrls(
    input.photoUrls,
    existing.photos.map((photo) => photo.url),
  );
  const amenities = await amenityIds(input.amenitySlugs);
  const keptSharing = input.rooms.map((room) => room.sharingType);

  await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: { id: propertyId },
      data: {
        ...listingFields(input),
        cityId: city.id,
        areaId: area.id,
        status: existing.status === "REJECTED" ? "PENDING_REVIEW" : existing.status,
      },
    });
    await tx.propertyAmenity.deleteMany({ where: { propertyId } });
    if (amenities.length) {
      await tx.propertyAmenity.createMany({
        data: amenities.map((amenityId) => ({ propertyId, amenityId })),
      });
    }
    await tx.photo.deleteMany({ where: { propertyId } });
    await tx.photo.createMany({
      data: input.photoUrls.map((url, index) => ({
        propertyId,
        url,
        sortOrder: index,
        alt: input.name,
      })),
    });
    await tx.roomType.deleteMany({
      where: { propertyId, sharingType: { notIn: keptSharing } },
    });
    await generateFromCounts(propertyId, input.rooms as RoomSpec[], tx);
  }, LISTING_TX_OPTIONS);

  return prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    include: publicInclude,
  });
}

export async function listOwnerProperties(ownerProfileId: string) {
  return prisma.property.findMany({
    where: { ownerId: ownerProfileId },
    include: publicInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function incrementView(slug: string) {
  await prisma.property.updateMany({
    where: { slug, status: "PUBLISHED" },
    data: { viewCount: { increment: 1 } },
  });
}

export { VerificationLevel };
