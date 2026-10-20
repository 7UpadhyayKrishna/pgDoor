import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let configured = false;
let loadPromise: Promise<typeof google> | null = null;

export function getMapsBrowserKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

export async function loadGoogleMaps(): Promise<typeof google | null> {
  const key = getMapsBrowserKey();
  if (!key) return null;
  if (typeof window === "undefined") return null;
  if (window.google?.maps?.Map) return window.google;

  if (!configured) {
    setOptions({
      key,
      v: "weekly",
    });
    configured = true;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      await importLibrary("maps");
      await importLibrary("marker");
      return window.google;
    })();
  }

  return loadPromise;
}

export function formatRentPin(rent: number) {
  if (rent >= 100000) return `₹${(rent / 100000).toFixed(1)}L`;
  if (rent >= 1000) {
    const k = rent / 1000;
    return `₹${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `₹${rent}`;
}
