import { HttpError } from "@/lib/rbac";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
  cityName: string | null;
  areaName: string | null;
};

const PLACES_API = "https://places.googleapis.com/v1";
const NCR_CENTER = { latitude: 28.6139, longitude: 77.209 };
/** Places API (New) caps locationBias circles at 50 km. */
const NCR_BIAS_RADIUS_METERS = 50000;

function placesKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new HttpError(503, "Google Maps is not configured");
  }
  return key;
}

type PlacesApiError = { error?: { message?: string; status?: string } };

export async function autocompletePlaces(
  query: string,
  opts?: { forDestination?: boolean },
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const body: Record<string, unknown> = {
    input: q,
    includedRegionCodes: ["in"],
    locationBias: {
      circle: { center: NCR_CENTER, radius: NCR_BIAS_RADIUS_METERS },
    },
  };
  // Destinations include establishments (colleges, offices, metros); owner addresses stay geocode-only.
  if (!opts?.forDestination) {
    body.includedPrimaryTypes = ["geocode"];
  }

  const res = await fetch(`${PLACES_API}/places:autocomplete`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": placesKey(),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as PlacesApiError & {
    suggestions?: { placePrediction?: { placeId: string; text?: { text: string } } }[];
  };

  if (!res.ok) {
    throw new HttpError(502, data.error?.message ?? "Could not fetch place suggestions");
  }

  return (data.suggestions ?? []).flatMap((s) =>
    s.placePrediction
      ? [
          {
            placeId: s.placePrediction.placeId,
            description: s.placePrediction.text?.text ?? "",
          },
        ]
      : [],
  );
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const res = await fetch(`${PLACES_API}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": placesKey(),
      "X-Goog-FieldMask": "id,formattedAddress,location,addressComponents",
    },
  });
  const data = (await res.json()) as PlacesApiError & {
    id?: string;
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
  };

  if (!res.ok || !data.location) {
    throw new HttpError(502, data.error?.message ?? "Could not load place details");
  }

  const components = data.addressComponents ?? [];
  const find = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types?.includes(t)))?.longText ?? null;

  return {
    placeId: data.id ?? placeId,
    address: data.formattedAddress ?? "",
    latitude: data.location.latitude,
    longitude: data.location.longitude,
    cityName: find("locality", "administrative_area_level_2") ?? find("administrative_area_level_1"),
    areaName:
      find("sublocality_level_1", "sublocality", "neighborhood") ??
      find("sublocality_level_2") ??
      null,
  };
}

export type NearbyCategory = "cafes" | "restaurants" | "shopping" | "attractions" | "hangouts";

/** Map-layer categories for explore UI. */
export type MapPoiLayer = "transport" | "daily" | "lifestyle" | "essentials";

export type NearbyPlace = {
  placeId: string;
  name: string;
  category: NearbyCategory;
  rating?: number;
  userRatingsTotal?: number;
  vicinity?: string;
  mapsUrl: string;
  latitude?: number;
  longitude?: number;
};

export type MapPoi = {
  placeId: string;
  name: string;
  layer: MapPoiLayer;
  latitude: number;
  longitude: number;
  vicinity?: string;
};

const NEARBY_TYPE_GROUPS: { category: NearbyCategory; types: string[] }[] = [
  { category: "cafes", types: ["cafe"] },
  { category: "restaurants", types: ["restaurant"] },
  { category: "shopping", types: ["shopping_mall", "department_store"] },
  { category: "attractions", types: ["tourist_attraction"] },
  { category: "hangouts", types: ["park", "movie_theater"] },
];

export const MAP_LAYER_TYPES: Record<MapPoiLayer, string[]> = {
  transport: ["subway_station", "bus_station", "train_station", "transit_station"],
  daily: ["cafe", "grocery_store", "supermarket", "restaurant"],
  lifestyle: ["shopping_mall", "gym", "park"],
  essentials: ["hospital", "pharmacy", "doctor"],
};

const PER_CATEGORY_LIMIT = 4;
const PER_LAYER_LIMIT = 12;

type NearbyApiResult = {
  placeId: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  vicinity?: string;
  latitude?: number;
  longitude?: number;
};

async function nearbySearch(
  lat: number,
  lng: number,
  types: string[],
  radiusMeters: number,
  key: string,
  maxResultCount = 20,
): Promise<NearbyApiResult[]> {
  const res = await fetch(`${PLACES_API}/places:searchNearby`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.shortFormattedAddress,places.location",
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    }),
    next: { revalidate: 21600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    places?: {
      id: string;
      displayName?: { text: string };
      rating?: number;
      userRatingCount?: number;
      shortFormattedAddress?: string;
      location?: { latitude: number; longitude: number };
    }[];
  };

  return (data.places ?? []).map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "",
    rating: p.rating,
    userRatingsTotal: p.userRatingCount,
    vicinity: p.shortFormattedAddress,
    latitude: p.location?.latitude,
    longitude: p.location?.longitude,
  }));
}

function mapsPlaceUrl(placeId: string) {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

export async function fetchNearbyPlaces({
  lat,
  lng,
  radiusMeters = 2500,
}: {
  lat: number;
  lng: number;
  radiusMeters?: number;
}): Promise<NearbyPlace[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  const categoryResults = await Promise.all(
    NEARBY_TYPE_GROUPS.map(async ({ category, types }) => {
      const rows = await nearbySearch(lat, lng, types, radiusMeters, key);
      const localSeen = new Set<string>();
      const places: NearbyPlace[] = [];

      for (const row of rows) {
        if (!row.placeId || localSeen.has(row.placeId)) continue;
        localSeen.add(row.placeId);
        places.push({
          placeId: row.placeId,
          name: row.name,
          category,
          rating: row.rating,
          userRatingsTotal: row.userRatingsTotal,
          vicinity: row.vicinity,
          mapsUrl: mapsPlaceUrl(row.placeId),
          latitude: row.latitude,
          longitude: row.longitude,
        });
      }

      places.sort((a, b) => {
        const ratingsDiff = (b.userRatingsTotal ?? 0) - (a.userRatingsTotal ?? 0);
        if (ratingsDiff !== 0) return ratingsDiff;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });

      return { category, places: places.slice(0, PER_CATEGORY_LIMIT) };
    }),
  );

  const globalSeen = new Set<string>();
  const order: NearbyCategory[] = ["cafes", "restaurants", "shopping", "attractions", "hangouts"];
  const byCategory = new Map(categoryResults.map((r) => [r.category, r.places]));

  return order.flatMap((category) => {
    const places = byCategory.get(category) ?? [];
    return places.filter((p) => {
      if (globalSeen.has(p.placeId)) return false;
      globalSeen.add(p.placeId);
      return true;
    });
  });
}

/** Fetch POIs for explore map layer toggles. */
export async function fetchMapLayerPois({
  lat,
  lng,
  layers,
  radiusMeters = 1500,
}: {
  lat: number;
  lng: number;
  layers: MapPoiLayer[];
  radiusMeters?: number;
}): Promise<MapPoi[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || layers.length === 0) return [];

  const batches = await Promise.all(
    layers.map(async (layer) => {
      const rows = await nearbySearch(lat, lng, MAP_LAYER_TYPES[layer], radiusMeters, key);
      const seen = new Set<string>();
      const pois: MapPoi[] = [];
      for (const row of rows) {
        if (!row.placeId || seen.has(row.placeId)) continue;
        if (row.latitude == null || row.longitude == null) continue;
        seen.add(row.placeId);
        pois.push({
          placeId: row.placeId,
          name: row.name,
          layer,
          latitude: row.latitude,
          longitude: row.longitude,
          vicinity: row.vicinity,
        });
      }
      return pois.slice(0, PER_LAYER_LIMIT);
    }),
  );

  const globalSeen = new Set<string>();
  return batches.flat().filter((p) => {
    if (globalSeen.has(p.placeId)) return false;
    globalSeen.add(p.placeId);
    return true;
  });
}
