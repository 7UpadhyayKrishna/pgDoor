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

function placesKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new HttpError(503, "Google Maps is not configured");
  }
  return key;
}

export async function autocompletePlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", q);
  url.searchParams.set("key", placesKey());
  url.searchParams.set("components", "country:in");
  url.searchParams.set("types", "geocode");
  // Bias toward NCR
  url.searchParams.set("location", "28.6139,77.2090");
  url.searchParams.set("radius", "80000");

  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    predictions?: { place_id: string; description: string }[];
  };

  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") {
    throw new HttpError(502, data.error_message ?? "Could not fetch place suggestions");
  }

  return (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
  }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", placesKey());
  url.searchParams.set("fields", "formatted_address,geometry,address_component,place_id");

  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    result?: {
      place_id: string;
      formatted_address?: string;
      geometry?: { location?: { lat: number; lng: number } };
      address_components?: { long_name: string; short_name: string; types: string[] }[];
    };
  };

  if (data.status !== "OK" || !data.result?.geometry?.location) {
    throw new HttpError(502, data.error_message ?? "Could not load place details");
  }

  const components = data.result.address_components ?? [];
  const find = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

  return {
    placeId: data.result.place_id,
    address: data.result.formatted_address ?? "",
    latitude: data.result.geometry.location.lat,
    longitude: data.result.geometry.location.lng,
    cityName: find("locality", "administrative_area_level_2") ?? find("administrative_area_level_1"),
    areaName:
      find("sublocality_level_1", "sublocality", "neighborhood") ??
      find("sublocality_level_2") ??
      null,
  };
}

export type NearbyCategory = "cafes" | "restaurants" | "shopping" | "attractions" | "hangouts";

export type NearbyPlace = {
  placeId: string;
  name: string;
  category: NearbyCategory;
  rating?: number;
  userRatingsTotal?: number;
  vicinity?: string;
  mapsUrl: string;
};

const NEARBY_TYPE_GROUPS: { category: NearbyCategory; types: string[] }[] = [
  { category: "cafes", types: ["cafe"] },
  { category: "restaurants", types: ["restaurant"] },
  { category: "shopping", types: ["shopping_mall", "department_store"] },
  { category: "attractions", types: ["tourist_attraction"] },
  { category: "hangouts", types: ["park", "movie_theater"] },
];

const PER_CATEGORY_LIMIT = 4;

type NearbyApiResult = {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
};

async function nearbySearchByType(
  lat: number,
  lng: number,
  type: string,
  radiusMeters: number,
  key: string,
): Promise<NearbyApiResult[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("type", type);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 21600 } });
  const data = (await res.json()) as {
    status: string;
    results?: NearbyApiResult[];
  };

  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") return [];
  return data.results ?? [];
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
      const batches = await Promise.all(
        types.map((type) => nearbySearchByType(lat, lng, type, radiusMeters, key)),
      );
      const localSeen = new Set<string>();
      const places: NearbyPlace[] = [];

      for (const row of batches.flat()) {
        if (!row.place_id || localSeen.has(row.place_id)) continue;
        localSeen.add(row.place_id);
        places.push({
          placeId: row.place_id,
          name: row.name,
          category,
          rating: row.rating,
          userRatingsTotal: row.user_ratings_total,
          vicinity: row.vicinity,
          mapsUrl: mapsPlaceUrl(row.place_id),
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
