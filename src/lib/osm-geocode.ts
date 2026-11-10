import type { PlaceDetails, PlaceSuggestion } from "@/lib/places";

/**
 * Free OpenStreetMap geocoding via Photon (photon.komoot.io), used when Google Places is
 * unavailable. Photon allows search-as-you-type, unlike the public Nominatim instance.
 */
const PHOTON = "https://photon.komoot.io";
const INDIA_BBOX = "68.1,6.5,97.4,35.7";
const NCR_CENTER = { lat: 28.6139, lon: 77.209 };
const USER_AGENT = "pgDoor/1.0 (+https://pgdoor.vercel.app)";
export const OSM_PLACE_PREFIX = "osm:";

type PhotonFeature = {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
    osm_key?: string;
  };
  geometry: { coordinates: [number, number] };
};

function toDetails(feature: PhotonFeature): Omit<PlaceDetails, "placeId"> {
  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const parts = [p.name, street, p.locality, p.district, p.city, p.state, p.postcode].filter(
    (part): part is string => Boolean(part),
  );
  const address = parts.filter((part, i) => parts.indexOf(part) === i).join(", ");
  return {
    address,
    latitude,
    longitude,
    cityName: p.city ?? p.county ?? null,
    areaName: p.district ?? p.locality ?? (p.osm_key === "place" ? (p.name ?? null) : null),
  };
}

/** The place is encoded into its id so `getPlaceDetails` can return it without another lookup. */
function encodePlaceId(details: Omit<PlaceDetails, "placeId">) {
  return OSM_PLACE_PREFIX + Buffer.from(JSON.stringify(details)).toString("base64url");
}

export function decodeOsmPlaceId(placeId: string): PlaceDetails | null {
  if (!placeId.startsWith(OSM_PLACE_PREFIX)) return null;
  try {
    const details = JSON.parse(
      Buffer.from(placeId.slice(OSM_PLACE_PREFIX.length), "base64url").toString("utf8"),
    ) as Omit<PlaceDetails, "placeId">;
    if (typeof details.latitude !== "number" || typeof details.longitude !== "number") return null;
    return { placeId, ...details };
  } catch {
    return null;
  }
}

async function photon(path: string, params: Record<string, string>) {
  const url = `${PHOTON}${path}?${new URLSearchParams({ lang: "en", ...params })}`;
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return (data.features ?? []).filter((f) => f.properties.countrycode === "IN");
}

export async function osmAutocomplete(query: string): Promise<PlaceSuggestion[]> {
  const features = await photon("/api/", {
    q: query,
    limit: "8",
    bbox: INDIA_BBOX,
    lat: String(NCR_CENTER.lat),
    lon: String(NCR_CENTER.lon),
  });
  const seen = new Set<string>();
  return features.flatMap((feature) => {
    const details = toDetails(feature);
    if (!details.address || seen.has(details.address)) return [];
    seen.add(details.address);
    return [{ placeId: encodePlaceId(details), description: details.address }];
  });
}

export async function osmReverse(latitude: number, longitude: number) {
  const [feature] = await photon("/reverse", { lat: String(latitude), lon: String(longitude), limit: "1" });
  return feature ? { ...toDetails(feature), latitude, longitude } : null;
}
