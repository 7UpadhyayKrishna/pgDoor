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
