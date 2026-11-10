import { unstable_cache } from "next/cache";
import { haversineKm } from "@/lib/utils";
import type { CommuteSlot } from "@/lib/commute/modes";
import { googleTravelMode, type CommuteMode } from "@/lib/commute/modes";
import { departureTimeForSlot } from "@/lib/commute/time";

export const DEFAULT_PREFILTER_KM = 25;
const BATCH_SIZE = 25;
const ROAD_FACTOR = 1.4;

function mapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY ?? "";
}

export function monthlyElementBudget() {
  const raw = Number(process.env.COMMUTE_MONTHLY_ELEMENT_BUDGET ?? "200000");
  return Number.isFinite(raw) && raw > 0 ? raw : 200000;
}

function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

type MatrixElement = {
  originIndex?: number;
  condition?: string;
  duration?: string;
  distanceMeters?: number;
};

export type MatrixRow = { minutes: number | null; distanceMeters: number | null };

async function fetchRouteMatrixBatch(
  origins: { lat: number; lng: number }[],
  dest: { lat: number; lng: number },
  googleMode: string,
  departureTime?: string,
  trafficAware?: boolean,
): Promise<MatrixRow[]> {
  const empty = origins.map(() => ({ minutes: null, distanceMeters: null }));
  const key = mapsKey();
  if (!key || origins.length === 0) return empty;

  const waypoint = (lat: number, lng: number) => ({
    waypoint: { location: { latLng: { latitude: lat, longitude: lng } } },
  });

  const body: Record<string, unknown> = {
    origins: origins.map((o) => waypoint(o.lat, o.lng)),
    destinations: [waypoint(dest.lat, dest.lng)],
    travelMode: googleMode,
  };
  if (departureTime) body.departureTime = departureTime;
  if (trafficAware && (googleMode === "DRIVE" || googleMode === "TWO_WHEELER")) {
    body.routingPreference = "TRAFFIC_AWARE";
  }

  const res = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "originIndex,duration,distanceMeters,condition",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Routes API ${res.status}`);
  }

  const elements = (await res.json()) as MatrixElement[];
  if (!Array.isArray(elements)) {
    throw new Error("Routes API returned an unexpected payload");
  }

  const rows: MatrixRow[] = [...empty];
  for (const el of elements) {
    const i = el.originIndex ?? 0;
    if (i >= rows.length || el.condition !== "ROUTE_EXISTS") continue;
    const seconds = el.duration ? Number.parseFloat(el.duration) : Number.NaN;
    rows[i] = {
      minutes: Number.isNaN(seconds) ? null : Math.round(seconds / 60),
      distanceMeters: el.distanceMeters ?? null,
    };
  }
  return rows;
}

async function routeMatrixUncached(
  originKey: string,
  destLat: number,
  destLng: number,
  googleMode: string,
  departureTime: string,
  trafficAware: boolean,
): Promise<MatrixRow[]> {
  const origins = originKey.split(";").map((pair) => {
    const [lat, lng] = pair.split(",").map(Number);
    return { lat, lng };
  });
  return fetchRouteMatrixBatch(
    origins,
    { lat: destLat, lng: destLng },
    googleMode,
    departureTime || undefined,
    trafficAware,
  );
}

const cachedMatrixBatch = unstable_cache(routeMatrixUncached, ["route-matrix-v4"], {
  revalidate: 3600,
});

export function estimateMinutes(km: number, mode: CommuteMode) {
  const speed =
    mode === "walk" ? 5 : mode === "cycle" ? 15 : mode === "metro" || mode === "bus" || mode === "rapid_metro" ? 25 : 28;
  return Math.max(1, Math.round((km / speed) * 60 * ROAD_FACTOR));
}

export async function fetchMatrix(
  origins: { id: string; lat: number; lng: number }[],
  dest: { lat: number; lng: number },
  mode: CommuteMode,
  slot: CommuteSlot,
  arrivalTime = "09:30",
): Promise<Map<string, { minutes: number; km: number; fromRoute: boolean }>> {
  const results = new Map<string, { minutes: number; km: number; fromRoute: boolean }>();
  for (const origin of origins) {
    const km = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    results.set(origin.id, { minutes: estimateMinutes(km, mode), km, fromRoute: false });
  }
  if (!mapsKey() || origins.length === 0) return results;

  const googleMode = googleTravelMode(mode);
  const departureTime = departureTimeForSlot(slot, arrivalTime);
  const trafficAware = slot === "peak" && (googleMode === "DRIVE" || googleMode === "TWO_WHEELER");

  for (let i = 0; i < origins.length; i += BATCH_SIZE) {
    const batch = origins.slice(i, i + BATCH_SIZE);
    const originKey = batch.map((o) => `${roundCoord(o.lat)},${roundCoord(o.lng)}`).join(";");
    try {
      const matrix = await cachedMatrixBatch(
        originKey,
        roundCoord(dest.lat),
        roundCoord(dest.lng),
        googleMode,
        departureTime,
        trafficAware,
      );
      batch.forEach((origin, idx) => {
        const row = matrix[idx];
        const fallback = results.get(origin.id)!;
        if (row?.minutes != null) {
          results.set(origin.id, {
            minutes: row.minutes,
            km: row.distanceMeters != null ? row.distanceMeters / 1000 : fallback.km,
            fromRoute: true,
          });
        }
      });
    } catch {
      // keep approximate fallbacks
    }
  }
  return results;
}
