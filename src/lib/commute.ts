import { DEFAULT_PREFILTER_KM, fetchMatrix } from "@/lib/commute/matrix";
import { parseCommuteMode, type LegacyTravelMode } from "@/lib/commute/modes";

export type TravelMode = LegacyTravelMode;

export type CommuteResult = {
  minutes: number | null;
  distanceKm: number;
  text: string;
  mode: TravelMode;
  fromRoute: boolean;
};

const MODE_LABEL: Record<TravelMode, string> = {
  driving: "by car",
  transit: "by transit",
  walking: "walking",
  bicycling: "by bike",
};

export { DEFAULT_PREFILTER_KM };

function formatCommuteText(minutes: number | null, distanceKm: number, mode: TravelMode) {
  if (minutes != null) {
    return `${minutes} min ${MODE_LABEL[mode]}`;
  }
  const km = distanceKm < 10 ? distanceKm.toFixed(1) : String(Math.round(distanceKm));
  return `${km} km away`;
}

export async function enrichCommutes(
  origins: { id: string; lat: number; lng: number }[],
  dest: { lat: number; lng: number },
  mode: TravelMode,
): Promise<Map<string, CommuteResult>> {
  const product = parseCommuteMode(mode);
  const matrix = await fetchMatrix(origins, dest, product, "peak");
  const results = new Map<string, CommuteResult>();
  for (const origin of origins) {
    const row = matrix.get(origin.id);
    const distanceKm = row?.km ?? 0;
    const minutes = row?.minutes ?? null;
    results.set(origin.id, {
      minutes,
      distanceKm,
      text: formatCommuteText(minutes, distanceKm, mode),
      mode,
      fromRoute: Boolean(row?.fromRoute),
    });
  }
  return results;
}

export function estimateRadiusKm(commuteMaxMinutes?: number, mode?: TravelMode | string): number {
  if (!commuteMaxMinutes) return DEFAULT_PREFILTER_KM;
  const product = parseCommuteMode(mode);
  const speed =
    product === "walk" ? 5 : product === "cycle" ? 15 : product === "metro" || product === "bus" ? 25 : 35;
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
