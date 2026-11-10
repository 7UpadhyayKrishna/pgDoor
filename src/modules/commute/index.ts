import {
  CommuteMode as PrismaMode,
  CommuteSlot as PrismaSlot,
  Prisma,
  type CommuteSource,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/utils";
import { DEFAULT_FARE_RULES } from "@/lib/commute/fare-rules";
import { dailyCost, monthlyCommute, oneWayCost, trueMonthlyCost } from "@/lib/commute/fares";
import { fetchMatrix } from "@/lib/commute/matrix";
import { ALL_DETAIL_MODES, MVP_MODES, parseCommuteMode, type CommuteMode, type CommuteSlot } from "@/lib/commute/modes";
import { recommendedMode } from "@/lib/commute/recommend";
import { commuteRankScore, invertNorm, multiDestinationTime } from "@/lib/commute/ranking";
import { cellFor } from "@/lib/geo/h3";

const CACHE_MS = 30 * 24 * 60 * 60 * 1000;
/** One Prisma `$transaction([...upserts])` of a cold GPS search used to be thousands of rows and tripped Supabase's statement timeout. */
const PERSIST_CHUNK = 80;
/** Live Google matrix calls per travel-mode group. The rest stay in-memory estimates. */
const DEFAULT_LIVE_ROUTE_LIMIT = 75;
const CACHE_IN_LIST_LIMIT = 80;

type PersistRow = {
  propertyId: string;
  destH3: string;
  mode: CommuteMode;
  slot: CommuteSlot;
  minutes: number;
  km: number;
  oneWayCost: number;
  approximate: boolean;
  source: CommuteSource;
  legs?: unknown;
};

export function nearestForLiveRoutes<T extends { lat: number; lng: number }>(
  origins: T[],
  dest: { lat: number; lng: number },
  limit: number,
): T[] {
  if (origins.length <= limit) return origins;
  return [...origins]
    .sort(
      (a, b) =>
        haversineKm(a.lat, a.lng, dest.lat, dest.lng) - haversineKm(b.lat, b.lng, dest.lat, dest.lng),
    )
    .slice(0, limit);
}

export type ModeQuote = {
  mode: CommuteMode;
  minutes: number;
  km: number;
  oneWayCost: number;
  dailyCost: number;
  monthlyCost: number;
  approximate: boolean;
  fromRoute: boolean;
  sourceUrl: string;
  estimate: boolean;
  computedAt: Date;
  legs?: unknown;
};

export type PropertyCommute = {
  quotes: ModeQuote[];
  recommended: ModeQuote;
  cheapest: ModeQuote;
  fastest: ModeQuote;
  trueMonthlyCost: number;
  selected: ModeQuote;
  rankMinutes: number;
};

export type CommuteQuery = {
  destLat: number;
  destLng: number;
  destLabel?: string;
  mode?: CommuteMode;
  slot?: CommuteSlot;
  arrivalTime?: string;
  commuteDays?: number;
  maxMinutes?: number;
  maxDailyCost?: number;
  valueOfTimePerHour?: number;
  foodAddon?: number;
  extraDests?: { lat: number; lng: number; tripsPerWeek: number; weight: number }[];
  rankingStyle?: "weighted" | "fair";
};

function asPrismaMode(mode: CommuteMode): PrismaMode {
  return mode as PrismaMode;
}

type CachedEdge = {
  mode: CommuteMode | PrismaMode;
  minutes: number;
  km: number;
  oneWayCost: number;
  approximate: boolean;
  source: CommuteSource;
  computedAt: Date;
  legs?: unknown;
};

function quoteFromEdge(edge: CachedEdge, days: number): ModeQuote {
  const daily = dailyCost(edge.oneWayCost);
  return {
    mode: edge.mode as CommuteMode,
    minutes: edge.minutes,
    km: edge.km,
    oneWayCost: edge.oneWayCost,
    dailyCost: daily,
    monthlyCost: monthlyCommute(daily, days),
    approximate: edge.approximate,
    fromRoute: edge.source === "google",
    sourceUrl: edge.source === "estimate" ? "estimate" : "fare_table",
    estimate: edge.source !== "google",
    computedAt: edge.computedAt,
    legs: edge.legs,
  };
}

function persistValue(row: PersistRow) {
  return Prisma.sql`(
    ${crypto.randomUUID()},
    ${row.propertyId},
    ${row.destH3},
    CAST(${asPrismaMode(row.mode)} AS "CommuteMode"),
    CAST(${row.slot} AS "CommuteSlot"),
    ${row.minutes},
    ${row.km},
    ${row.oneWayCost},
    CAST(${JSON.stringify(row.legs ?? null)} AS JSONB),
    CAST(${row.source} AS "CommuteSource"),
    NOW(),
    ${row.approximate}
  )`;
}

async function persistChunkRaw(chunk: PersistRow[]) {
  await prisma.$executeRaw`
    INSERT INTO "CommuteEdge" (
      id, "propertyId", "destH3", mode, slot, minutes, km, "oneWayCost", legs, source, "computedAt", approximate
    )
    VALUES ${Prisma.join(chunk.map(persistValue))}
    ON CONFLICT ("propertyId", "destH3", mode, slot)
    DO UPDATE SET
      minutes = EXCLUDED.minutes,
      km = EXCLUDED.km,
      "oneWayCost" = EXCLUDED."oneWayCost",
      legs = EXCLUDED.legs,
      source = EXCLUDED.source,
      "computedAt" = EXCLUDED."computedAt",
      approximate = EXCLUDED.approximate
  `;
}

async function persistChunkUpserts(chunk: PersistRow[]) {
  await prisma.commuteEdge.createMany({
    data: chunk.map((row) => ({
      propertyId: row.propertyId,
      destH3: row.destH3,
      mode: asPrismaMode(row.mode),
      slot: row.slot as PrismaSlot,
      minutes: row.minutes,
      km: row.km,
      oneWayCost: row.oneWayCost,
      approximate: row.approximate,
      source: row.source,
      legs: row.legs as object | undefined,
    })),
    skipDuplicates: true,
  });
}

async function persistEdges(rows: PersistRow[]) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += PERSIST_CHUNK) {
    const chunk = rows.slice(i, i + PERSIST_CHUNK);
    try {
      await persistChunkRaw(chunk);
    } catch {
      await persistChunkUpserts(chunk);
    }
  }
}

export async function fillCommuteQuotes(
  properties: { id: string; lat: number; lng: number; rent: number }[],
  query: CommuteQuery,
  modes: CommuteMode[] = MVP_MODES,
  options: { liveRouteLimit?: number; skipLiveIfCached?: boolean } = {},
): Promise<Map<string, PropertyCommute>> {
  const destH3 = cellFor(query.destLat, query.destLng);
  const slot: CommuteSlot = query.slot ?? "peak";
  const days = query.commuteDays ?? 22;
  const ids = properties.map((p) => p.id);
  const cutoff = new Date(Date.now() - CACHE_MS);
  const liveRouteLimit = options.liveRouteLimit ?? DEFAULT_LIVE_ROUTE_LIMIT;
  const skipLiveIfCached = options.skipLiveIfCached ?? true;
  const dest = { lat: query.destLat, lng: query.destLng };

  const cached =
    ids.length === 0
      ? []
      : await prisma.commuteEdge.findMany({
          where: {
            destH3,
            slot: slot as PrismaSlot,
            mode: { in: modes.map(asPrismaMode) },
            computedAt: { gte: cutoff },
            ...(ids.length <= CACHE_IN_LIST_LIMIT ? { propertyId: { in: ids } } : {}),
          },
        });

  const idSet = ids.length > CACHE_IN_LIST_LIMIT ? new Set(ids) : null;
  const byKey = new Map<string, CachedEdge>(
    cached
      .filter((row) => !idSet || idSet.has(row.propertyId))
      .map((row) => [`${row.propertyId}:${row.mode}`, row]),
  );
  const missingByMode = new Map<CommuteMode, { id: string; lat: number; lng: number }[]>();

  for (const mode of modes) {
    const missing = properties.filter((p) => !byKey.has(`${p.id}:${mode}`));
    if (missing.length) missingByMode.set(mode, missing);
  }

  const googleGroups = new Map<string, CommuteMode[]>();
  for (const mode of missingByMode.keys()) {
    const g =
      mode === "walk"
        ? "WALK"
        : mode === "cycle"
          ? "BICYCLE"
          : mode === "metro" || mode === "bus" || mode === "rapid_metro"
            ? "TRANSIT"
            : mode === "rapido"
              ? "TWO_WHEELER"
              : "DRIVE";
    const list = googleGroups.get(g) ?? [];
    list.push(mode);
    googleGroups.set(g, list);
  }

  const toPersist: PersistRow[] = [];
  const effectiveLiveLimit = skipLiveIfCached && byKey.size > 0 ? 0 : liveRouteLimit;

  await Promise.all(
    [...googleGroups.values()].map(async (groupedModes) => {
      const primary = groupedModes[0];
      const origins = nearestForLiveRoutes(missingByMode.get(primary) ?? [], dest, effectiveLiveLimit);
      if (origins.length === 0) return;
      const matrix = await fetchMatrix(origins, dest, primary, slot, query.arrivalTime);
      for (const origin of origins) {
        const row = matrix.get(origin.id);
        if (!row) continue;
        for (const mode of groupedModes) {
          const fare = oneWayCost({
            mode,
            km: row.km,
            minutes: row.minutes,
            slot,
            rules: DEFAULT_FARE_RULES,
          });
          const edge: PersistRow = {
            propertyId: origin.id,
            destH3,
            mode,
            slot,
            minutes: row.minutes,
            km: row.km,
            oneWayCost: fare.cost,
            approximate: !row.fromRoute,
            source: (row.fromRoute ? "google" : "estimate") as CommuteSource,
            legs: [
              {
                mode,
                minutes: row.minutes,
                km: row.km,
                instruction: `Leave PG, travel by ${mode}, arrive at destination`,
              },
            ],
          };
          byKey.set(`${origin.id}:${mode}`, { ...edge, computedAt: new Date() });
          toPersist.push(edge);
        }
      }
    }),
  );

  void persistEdges(toPersist).catch(() => undefined);

  const result = new Map<string, PropertyCommute>();
  for (const property of properties) {
    const quotes: ModeQuote[] = [];
    for (const mode of modes) {
      const edge = byKey.get(`${property.id}:${mode}`);
      if (!edge) {
        const km = haversineKm(property.lat, property.lng, query.destLat, query.destLng);
        const fare = oneWayCost({ mode, km, minutes: Math.round(km * 3), slot, rules: DEFAULT_FARE_RULES });
        quotes.push(
          quoteFromEdge(
            {
              mode,
              minutes: Math.max(1, Math.round(km * 3 * 1.4)),
              km,
              oneWayCost: fare.cost,
              approximate: true,
              source: "estimate",
              computedAt: new Date(),
              legs: null,
            },
            days,
          ),
        );
        continue;
      }
      quotes.push(quoteFromEdge(edge, days));
    }
    if (quotes.length === 0) continue;
    const rec =
      recommendedMode(
        quotes.map((q) => ({ mode: q.mode, minutes: q.minutes, monthlyCost: q.monthlyCost })),
        { maxMinutes: query.maxMinutes, valueOfTimePerHour: query.valueOfTimePerHour ?? 0 },
      ) ?? quotes[0];
    const recommended = quotes.find((q) => q.mode === rec.mode) ?? quotes[0];
    const cheapest = quotes.reduce((a, b) => (a.monthlyCost <= b.monthlyCost ? a : b));
    const fastest = quotes.reduce((a, b) => (a.minutes <= b.minutes ? a : b));
    const selected =
      (query.mode ? quotes.find((q) => q.mode === query.mode) : null) ?? recommended;
    result.set(property.id, {
      quotes,
      recommended,
      cheapest,
      fastest,
      trueMonthlyCost: trueMonthlyCost(property.rent, selected.monthlyCost, query.foodAddon ?? 0),
      selected,
      rankMinutes: selected.minutes,
    });
  }

  if (query.extraDests?.length) {
    const extras = query.extraDests.slice(0, 2);
    const extraMaps = await Promise.all(
      extras.map((dest) =>
        fillCommuteQuotes(
          properties,
          { ...query, destLat: dest.lat, destLng: dest.lng, extraDests: undefined },
          modes,
          options,
        ),
      ),
    );
    for (const property of properties) {
      const primary = result.get(property.id);
      if (!primary) continue;
      const legs = [
        { minutes: primary.selected.minutes, tripsPerWeek: 5, weight: 1 },
        ...extras.map((dest, i) => ({
          minutes: extraMaps[i]?.get(property.id)?.selected.minutes ?? primary.selected.minutes,
          tripsPerWeek: dest.tripsPerWeek,
          weight: dest.weight,
        })),
      ];
      primary.rankMinutes = combineMultiDestMinutes(legs, query.rankingStyle ?? "weighted");
    }
  }

  return result;
}

export function rankProperties<T extends { id: string; minRent: number; ratingAvg: number; featured: boolean; verificationLevel: string; availabilityConfirmedAt: Date }>(
  rows: T[],
  commutes: Map<string, PropertyCommute>,
  extras?: {
    preferenceMatch?: (row: T) => number;
    rankingStyle?: "weighted" | "fair";
  },
) {
  const times = rows.map((row) => commutes.get(row.id)?.rankMinutes ?? commutes.get(row.id)?.selected.minutes ?? 90);
  const costs = rows.map((row) => commutes.get(row.id)?.trueMonthlyCost ?? row.minRent);
  const minT = Math.min(...times, 10);
  const maxT = Math.max(...times, 90);
  const minC = Math.min(...costs, 8000);
  const maxC = Math.max(...costs, 25000);
  const now = Date.now();

  return [...rows].sort((a, b) => {
    const ca = commutes.get(a.id);
    const cb = commutes.get(b.id);
    const scoreA = commuteRankScore({
      commuteTimeNorm: invertNorm(ca?.rankMinutes ?? ca?.selected.minutes ?? 90, minT, maxT),
      trueCostNorm: invertNorm(ca?.trueMonthlyCost ?? a.minRent, minC, maxC),
      preferenceMatch: extras?.preferenceMatch?.(a) ?? 0.5,
      livability: 0.5,
      trust: a.verificationLevel === "UNVERIFIED" ? 0.2 : 0.8,
      freshness: Math.max(0, 1 - (now - a.availabilityConfirmedAt.getTime()) / (14 * 86400000)),
    });
    const scoreB = commuteRankScore({
      commuteTimeNorm: invertNorm(cb?.rankMinutes ?? cb?.selected.minutes ?? 90, minT, maxT),
      trueCostNorm: invertNorm(cb?.trueMonthlyCost ?? b.minRent, minC, maxC),
      preferenceMatch: extras?.preferenceMatch?.(b) ?? 0.5,
      livability: 0.5,
      trust: b.verificationLevel === "UNVERIFIED" ? 0.2 : 0.8,
      freshness: Math.max(0, 1 - (now - b.availabilityConfirmedAt.getTime()) / (14 * 86400000)),
    });
    if (scoreB !== scoreA) return scoreB - scoreA;
    return Number(b.featured) - Number(a.featured);
  });
}

export function combineMultiDestMinutes(
  quotes: { minutes: number; tripsPerWeek: number; weight: number }[],
  style: "weighted" | "fair",
) {
  return multiDestinationTime(quotes, style);
}

export function cardFromCommute(commute: PropertyCommute) {
  const selected = commute.selected;
  return {
    minutes: selected.minutes,
    distanceKm: selected.km,
    text: `${selected.minutes} min · ${selected.mode.replace("_", " ")}`,
    mode: selected.mode,
    fromRoute: selected.fromRoute,
    trueMonthlyCost: commute.trueMonthlyCost,
    monthlyCommute: selected.monthlyCost,
    dailyCost: selected.dailyCost,
    oneWayCost: selected.oneWayCost,
    approximate: selected.approximate,
    computedAt: selected.computedAt.toISOString(),
    cheapest: selected.mode === commute.cheapest.mode,
    fastest: selected.mode === commute.fastest.mode,
    recommended: selected.mode === commute.recommended.mode,
  };
}

export { parseCommuteMode, MVP_MODES, ALL_DETAIL_MODES, cellFor };
