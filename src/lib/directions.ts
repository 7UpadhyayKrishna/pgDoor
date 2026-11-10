/** Client-safe helpers for distance text and Google Maps direction links. */

export type TravelModeName = "driving" | "transit" | "walking" | "bicycling";

export type Origin = {
  lat: number;
  lng: number;
  label?: string;
  mode?: string;
};

const MODE_TEXT: Record<TravelModeName, string> = {
  driving: "by car",
  transit: "by transit",
  walking: "walking",
  bicycling: "by bike",
};

const PRODUCT_MODE_TEXT: Record<string, string> = {
  walk: "walking",
  cycle: "by bike",
  metro: "by metro",
  rapid_metro: "by Rapid Metro",
  bus: "by bus",
  auto: "by auto",
  shared_auto: "by shared auto",
  rapido: "by Rapido",
  cab: "by cab",
  own_vehicle: "by own vehicle",
};

/** "by metro", "by bus"… — keeps the mode the tenant picked instead of collapsing to "by transit". */
export function modeText(mode?: string) {
  return (mode && PRODUCT_MODE_TEXT[mode]) || MODE_TEXT[asMode(mode)];
}

function asMode(mode?: string): TravelModeName {
  if (mode === "walk") return "walking";
  if (mode === "cycle" || mode === "rapido" || mode === "bicycling") return "bicycling";
  if (mode === "auto" || mode === "cab" || mode === "own_vehicle" || mode === "driving") return "driving";
  return "transit";
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** "3.2 km · 25 min by transit", or just the distance when there is no route time. */
export function distanceLine(input: {
  distanceKm: number | null;
  minutes: number | null;
  mode?: string;
}) {
  if (input.distanceKm == null) return null;
  const distance = formatDistanceKm(input.distanceKm);
  if (input.minutes == null) return distance;
  return `${distance} · ${input.minutes} min ${modeText(input.mode)}`;
}

export function googleDirectionsUrl(
  origin: Origin,
  destination: { latitude: number; longitude: number },
) {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: asMode(origin.mode),
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Listing link that keeps the preferred location so the detail page can show distance too. */
export function listingHref(slug: string, origin?: Origin | null) {
  if (!origin) return `/pg/${slug}`;
  const params = new URLSearchParams({
    destLat: String(origin.lat),
    destLng: String(origin.lng),
  });
  if (origin.label) params.set("destLabel", origin.label);
  if (origin.mode) params.set("mode", origin.mode);
  return `/pg/${slug}?${params.toString()}`;
}
