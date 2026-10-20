import { unstable_cache } from "next/cache";
import { haversineKm } from "@/lib/utils";

export type TravelMode = "driving" | "transit" | "walking" | "bicycling";

export type CommuteResult = {
  minutes: number | null;
  distanceKm: number;
  text: string;
  mode: TravelMode;
  /** True when minutes came from the Routes API; false when haversine fallback. */
  fromRoute: boolean;
};

const MODE_LABEL: Record<TravelMode, string> = {
  driving: "by car",
  transit: "by transit",
  walking: "walking",
  bicycling: "by bike",
};

const BATCH_SIZE = 25;
/** Prefilter radius when commuteMax is set (generous so matrix can refine). */
export const DEFAULT_PREFILTER_KM = 25;

function mapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY ?? "";
}

function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

function formatCommuteText(minutes: number | null, distanceKm: number, mode: TravelMode) {
  if (minutes != null) {
    return `${minutes} min ${MODE_LABEL[mode]}`;
  }
  const km =
    distanceKm < 10 ? distanceKm.toFixed(1) : String(Math.round(distanceKm));
  return `${km} km away`;
}

const ROUTES_TRAVEL_MODE: Record<TravelMode, string> = {
  driving: "DRIVE",
  transit: "TRANSIT",
  walking: "WALK",
  // Google has no bicycle routing in India; "bike" there means scooter/motorbike.
  bicycling: "TWO_WHEELER",
};

type MatrixElement = {
  originIndex?: number;
  condition?: string;
  /** Protobuf duration string, e.g. "1394s". */
  duration?: string;
  distanceMeters?: number;
};

type MatrixRow = { minutes: number | null; distanceMeters: number | null };

async function fetchRouteMatrixBatch(
  origins: { lat: number; lng: number }[],
  dest: { lat: number; lng: number },
  mode: TravelMode,
): Promise<MatrixRow[]> {
  const empty = origins.map(() => ({ minutes: null, distanceMeters: null }));
  const key = mapsKey();
  if (!key || origins.length === 0) return empty;

  const waypoint = (lat: number, lng: number) => ({
    waypoint: { location: { latLng: { latitude: lat, longitude: lng } } },
  });

  const res = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "originIndex,duration,distanceMeters,condition",
    },
    body: JSON.stringify({
      origins: origins.map((o) => waypoint(o.lat, o.lng)),
      destinations: [waypoint(dest.lat, dest.lng)],
      travelMode: ROUTES_TRAVEL_MODE[mode],
    }),
  });
  // Throw rather than return empty rows so unstable_cache never stores a failed lookup.
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
  mode: TravelMode,
): Promise<MatrixRow[]> {
  const origins = originKey.split(";").map((pair) => {
    const [lat, lng] = pair.split(",").map(Number);
    return { lat, lng };
  });
  return fetchRouteMatrixBatch(origins, { lat: destLat, lng: destLng }, mode);
}

const cachedMatrixBatch = unstable_cache(
  routeMatrixUncached,
  ["route-matrix-v3"],
  { revalidate: 3600 },
);

/**
 * Enrich property origins with commute times to a destination.
 * Falls back to haversine distance when the Routes API is unavailable.
 */
export async function enrichCommutes(
  origins: { id: string; lat: number; lng: number }[],
  dest: { lat: number; lng: number },
  mode: TravelMode,
): Promise<Map<string, CommuteResult>> {
  const results = new Map<string, CommuteResult>();

  for (const origin of origins) {
    const distanceKm = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    results.set(origin.id, {
      minutes: null,
      distanceKm,
      text: formatCommuteText(null, distanceKm, mode),
      mode,
      fromRoute: false,
    });
  }

  if (!mapsKey() || origins.length === 0) return results;

  for (let i = 0; i < origins.length; i += BATCH_SIZE) {
    const batch = origins.slice(i, i + BATCH_SIZE);
    const originKey = batch
      .map((o) => `${roundCoord(o.lat)},${roundCoord(o.lng)}`)
      .join(";");

    try {
      const matrix = await cachedMatrixBatch(
        originKey,
        roundCoord(dest.lat),
        roundCoord(dest.lng),
        mode,
      );

      batch.forEach((origin, idx) => {
        const row = matrix[idx];
        const fallback = results.get(origin.id)!;
        const distanceKm =
          row?.distanceMeters != null
            ? row.distanceMeters / 1000
            : fallback.distanceKm;
        const minutes = row?.minutes ?? null;
        results.set(origin.id, {
          minutes,
          distanceKm,
          text: formatCommuteText(minutes, distanceKm, mode),
          mode,
          fromRoute: minutes != null,
        });
      });
    } catch {
      // Keep haversine fallbacks already set.
    }
  }

  return results;
}

export function estimateRadiusKm(commuteMaxMinutes?: number, mode?: TravelMode): number {
  if (!commuteMaxMinutes) return DEFAULT_PREFILTER_KM;
  // Rough speed assumptions for prefilter only (km/h).
  const speed =
    mode === "walking" ? 5 : mode === "bicycling" ? 30 : mode === "transit" ? 25 : 35;
  const estimated = (commuteMaxMinutes / 60) * speed * 1.4;
  return Math.min(Math.max(estimated, 5), DEFAULT_PREFILTER_KM);
}

export function parseBounds(raw?: string): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (!raw) return null;
  const parts = raw.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  const [south, west, north, east] = parts;
  return { south, west, north, east };
}

export { MODE_LABEL };
