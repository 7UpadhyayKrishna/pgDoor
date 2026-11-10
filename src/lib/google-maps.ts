import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let configured = false;
let loadPromise: Promise<typeof google | null> | null = null;
let authFailed = false;
const authFailureListeners = new Set<() => void>();

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function getMapsBrowserKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

/**
 * Google calls window.gm_authFailure for key, referrer and billing errors
 * (e.g. BillingNotEnabledMapError) after the script itself has loaded fine.
 */
export function onMapsAuthFailure(listener: () => void) {
  if (authFailed) listener();
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

function installAuthFailureHook() {
  if (typeof window === "undefined" || window.gm_authFailure) return;
  window.gm_authFailure = () => {
    authFailed = true;
    console.error("[maps] Google Maps rejected the API key (billing, referrer or API not enabled)");
    authFailureListeners.forEach((listener) => listener());
  };
}

export async function loadGoogleMaps(): Promise<typeof google | null> {
  const key = getMapsBrowserKey();
  if (!key) return null;
  if (typeof window === "undefined") return null;
  if (authFailed) return null;
  if (window.google?.maps?.Map) return window.google;

  installAuthFailureHook();
  if (!configured) {
    setOptions({
      key,
      v: "weekly",
    });
    configured = true;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        await importLibrary("maps");
        await importLibrary("marker");
        return window.google;
      } catch (error) {
        console.error("[maps] failed to load Google Maps", error);
        loadPromise = null;
        return null;
      }
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
