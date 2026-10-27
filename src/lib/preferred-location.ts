"use client";

import { useSyncExternalStore } from "react";

export type SavedLocation = { lat: number; lng: number; label: string };

const KEY = "pgdoor_preferred_location";
const EVENT = "pgdoor-preferred-location-change";

let cachedRaw: string | null = null;
let cachedValue: SavedLocation | null = null;

function readSaved(): SavedLocation | null {
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as SavedLocation) : null;
    cachedValue =
      parsed && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng) ? parsed : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

export function savePreferredLocation(location: SavedLocation) {
  const current = readSaved();
  if (
    current &&
    current.lat === location.lat &&
    current.lng === location.lng &&
    current.label === location.label
  ) {
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(location));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function usePreferredLocation() {
  return useSyncExternalStore(subscribe, readSaved, () => null);
}
