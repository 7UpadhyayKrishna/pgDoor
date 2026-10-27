"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Crosshair, MapPin, X } from "lucide-react";
import { DestinationSearch } from "@/components/search/destination-search";
import {
  savePreferredLocation,
  usePreferredLocation,
  type SavedLocation,
} from "@/lib/preferred-location";

export function PreferredLocation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const saved = usePreferredLocation();
  const [editing, setEditing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const lat = Number(params.get("destLat"));
  const lng = Number(params.get("destLng"));
  const active =
    params.get("destLat") && params.get("destLng") && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng, label: params.get("destLabel") || "your location" }
      : null;

  useEffect(() => {
    if (active) savePreferredLocation(active);
    // Persist whenever the URL location changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.lat, active?.lng, active?.label]);

  function apply(location: SavedLocation) {
    const next = new URLSearchParams(params.toString());
    next.set("destLat", String(location.lat));
    next.set("destLng", String(location.lng));
    next.set("destLabel", location.label);
    if (!next.get("sort")) next.set("sort", "commute");
    next.delete("page");
    next.delete("bounds");
    setEditing(false);
    router.push(`${pathname}?${next.toString()}`);
  }

  function clear() {
    const next = new URLSearchParams(params.toString());
    for (const key of ["destLat", "destLng", "destLabel", "commuteMax", "page", "bounds"]) {
      next.delete(key);
    }
    if (next.get("sort") === "commute") next.delete("sort");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setError("Location isn't available in this browser");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        apply({
          lat: Math.round(position.coords.latitude * 1e5) / 1e5,
          lng: Math.round(position.coords.longitude * 1e5) / 1e5,
          label: "Your location",
        });
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Allow location access and try again.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const gpsButton = (
    <button
      type="button"
      onClick={locateMe}
      disabled={locating}
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-border hover:bg-canvas disabled:opacity-60"
    >
      <Crosshair className="h-4 w-4" />
      {locating ? "Locating..." : "Use my current location"}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {active ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 font-medium text-ink">
              <MapPin className="h-4 w-4 text-primary" />
              Distance from: {active.label}
              <button
                type="button"
                aria-label="Stop showing distance"
                onClick={clear}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="font-medium text-primary hover:underline"
            >
              {editing ? "Cancel" : "Change"}
            </button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">See distance and directions from:</span>
            {saved ? (
              <button
                type="button"
                onClick={() => apply(saved)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 font-medium text-ink hover:bg-primary-soft/70"
              >
                <MapPin className="h-4 w-4 text-primary" />
                {saved.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="font-medium text-primary hover:underline"
            >
              {editing ? "Cancel" : "Office or college"}
            </button>
          </>
        )}
        {gpsButton}
      </div>
      {editing ? (
        <DestinationSearch
          className="max-w-md"
          onSelect={(place) =>
            apply({ lat: place.latitude, lng: place.longitude, label: place.label })
          }
        />
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
