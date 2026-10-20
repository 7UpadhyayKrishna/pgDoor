"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMaps, formatRentPin, getMapsBrowserKey } from "@/lib/google-maps";
import type { toPublicCard } from "@/modules/search";
import type { MapPoiLayer } from "@/lib/places";
import { cn } from "@/lib/utils";

type Card = ReturnType<typeof toPublicCard>;

type LandmarkPin = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
};

type PoiPin = {
  placeId: string;
  name: string;
  layer: MapPoiLayer;
  latitude: number;
  longitude: number;
};

const LAYER_LABELS: { id: MapPoiLayer; label: string }[] = [
  { id: "transport", label: "Transport" },
  { id: "daily", label: "Daily life" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "essentials", label: "Essentials" },
];

const LAYER_COLORS: Record<MapPoiLayer, string> = {
  transport: "#2563eb",
  daily: "#d97706",
  lifestyle: "#7c3aed",
  essentials: "#dc2626",
};

function createPricePinElement(rent: number, selected: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = formatRentPin(rent);
  el.style.cssText = [
    "border:none",
    "cursor:pointer",
    "font:600 12px/1 system-ui,sans-serif",
    "padding:6px 10px",
    "border-radius:999px",
    "white-space:nowrap",
    "box-shadow:0 2px 8px rgba(0,0,0,.18)",
    selected
      ? "background:#7a9b80;color:#fff;transform:scale(1.15);z-index:2"
      : "background:#fff;color:#1a1a1a",
  ].join(";");
  return el;
}

function createDotElement(color: string, title: string) {
  const el = document.createElement("div");
  el.title = title;
  el.style.cssText = [
    "width:10px",
    "height:10px",
    "border-radius:50%",
    `background:${color}`,
    "border:2px solid #fff",
    "box-shadow:0 1px 4px rgba(0,0,0,.25)",
  ].join(";");
  return el;
}

export function ExploreMap({
  properties,
  selectedId,
  onSelect,
  destination,
  onSearchArea,
  className,
}: {
  properties: Card[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  destination?: { lat: number; lng: number; label?: string } | null;
  onSearchArea?: (bounds: { south: number; west: number; north: number; east: number }) => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const destMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const poiMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const landmarkMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const idleListener = useRef<google.maps.MapsEventListener | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [layers, setLayers] = useState<Set<MapPoiLayer>>(new Set(["transport"]));
  const [pois, setPois] = useState<PoiPin[]>([]);
  const [landmarks, setLandmarks] = useState<LandmarkPin[]>([]);

  const selected = properties.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      if (!getMapsBrowserKey()) {
        setError("Map key not configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)");
        return;
      }
      const g = await loadGoogleMaps();
      if (cancelled || !g || !mapRef.current) {
        if (!cancelled && !g) setError("Could not load Google Maps");
        return;
      }

      const center = destination
        ? { lat: destination.lat, lng: destination.lng }
        : properties[0]
          ? { lat: properties[0].latitude, lng: properties[0].longitude }
          : { lat: 28.6139, lng: 77.209 };

      const map = new g.maps.Map(mapRef.current, {
        center,
        zoom: destination ? 12 : 11,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      });

      mapInstance.current = map;
      idleListener.current = map.addListener("idle", () => {
        setShowSearchArea(true);
      });
      setReady(true);
    }

    void initMap();
    return () => {
      cancelled = true;
      if (idleListener.current) {
        idleListener.current.remove();
        idleListener.current = null;
      }
    };
    // Initialize once on mount; destination/properties update markers separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Property markers
  useEffect(() => {
    if (!ready || !mapInstance.current || !window.google?.maps) return;
    const map = mapInstance.current;
    const { AdvancedMarkerElement } = google.maps.marker;

    markersRef.current.forEach((m) => {
      m.map = null;
    });
    markersRef.current = [];
    clustererRef.current?.clearMarkers();

    const markers = properties.map((p) => {
      const marker = new AdvancedMarkerElement({
        map: null,
        position: { lat: p.latitude, lng: p.longitude },
        content: createPricePinElement(p.minRent, p.id === selectedId),
        title: p.name,
        zIndex: p.id === selectedId ? 10 : 1,
      });
      marker.addListener("click", () => onSelect(p.id));
      return marker;
    });

    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers });

    if (properties.length > 0 && !selectedId) {
      const bounds = new google.maps.LatLngBounds();
      properties.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      if (destination) bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds, 64);
    }
  }, [ready, properties, selectedId, onSelect, destination]);

  // Update selected pin style + pan
  useEffect(() => {
    if (!ready || !mapInstance.current || !selected) return;
    markersRef.current.forEach((m, i) => {
      const p = properties[i];
      if (!p) return;
      m.content = createPricePinElement(p.minRent, p.id === selectedId);
      m.zIndex = p.id === selectedId ? 10 : 1;
    });
    mapInstance.current.panTo({ lat: selected.latitude, lng: selected.longitude });
    if ((mapInstance.current.getZoom() ?? 12) < 14) {
      mapInstance.current.setZoom(14);
    }
  }, [selectedId, selected, ready, properties]);

  // Destination marker
  useEffect(() => {
    if (!ready || !mapInstance.current || !window.google?.maps) return;
    if (destMarkerRef.current) {
      destMarkerRef.current.map = null;
      destMarkerRef.current = null;
    }
    if (!destination) return;
    const el = document.createElement("div");
    el.textContent = "★";
    el.title = destination.label ?? "Your destination";
    el.style.cssText =
      "width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)";
    destMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapInstance.current,
      position: { lat: destination.lat, lng: destination.lng },
      content: el,
      zIndex: 20,
    });
  }, [ready, destination]);

  // Load landmarks in view
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    const map = mapInstance.current;
    const b = map.getBounds();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    const qs = new URLSearchParams({
      north: String(ne.lat()),
      south: String(sw.lat()),
      east: String(ne.lng()),
      west: String(sw.lng()),
    });
    fetch(`/api/landmarks?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.landmarks) setLandmarks(data.landmarks);
      })
      .catch(() => undefined);
  }, [ready, showSearchArea, properties.length]);

  // Landmark markers (metro / college / office)
  useEffect(() => {
    if (!ready || !mapInstance.current || !window.google?.maps) return;
    landmarkMarkersRef.current.forEach((m) => {
      m.map = null;
    });
    landmarkMarkersRef.current = landmarks.map((l) => {
      const color =
        l.type === "METRO"
          ? LAYER_COLORS.transport
          : l.type === "COLLEGE" || l.type === "OFFICE"
            ? "#0f766e"
            : "#64748b";
      return new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: { lat: l.latitude, lng: l.longitude },
        content: createDotElement(color, l.name),
        title: `${l.name} (${l.type})`,
        zIndex: 0,
      });
    });
  }, [ready, landmarks]);

  // Fetch POI layers
  useEffect(() => {
    if (!ready || layers.size === 0) {
      setPois([]);
      return;
    }
    const anchor = selected
      ? { lat: selected.latitude, lng: selected.longitude }
      : destination
        ? { lat: destination.lat, lng: destination.lng }
        : properties[0]
          ? { lat: properties[0].latitude, lng: properties[0].longitude }
          : null;
    if (!anchor) return;

    const qs = new URLSearchParams({
      lat: String(anchor.lat),
      lng: String(anchor.lng),
      layers: [...layers].join(","),
    });
    const timer = setTimeout(() => {
      fetch(`/api/places/layers?${qs}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.pois) setPois(data.pois);
        })
        .catch(() => setPois([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [ready, layers, selected, destination, properties]);

  // POI markers
  useEffect(() => {
    if (!ready || !mapInstance.current || !window.google?.maps) return;
    poiMarkersRef.current.forEach((m) => {
      m.map = null;
    });
    poiMarkersRef.current = pois.map((p) => {
      return new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: { lat: p.latitude, lng: p.longitude },
        content: createDotElement(LAYER_COLORS[p.layer], p.name),
        title: p.name,
        zIndex: 0,
      });
    });
  }, [ready, pois]);

  function toggleLayer(id: MapPoiLayer) {
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSearchArea() {
    const map = mapInstance.current;
    if (!map || !onSearchArea) return;
    const b = map.getBounds();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    setShowSearchArea(false);
    onSearchArea({
      south: sw.lat(),
      west: sw.lng(),
      north: ne.lat(),
      east: ne.lng(),
    });
  }

  return (
    <div className={cn("relative h-full min-h-[320px] overflow-hidden rounded-[18px] bg-canvas", className)}>
      <div ref={mapRef} className="absolute inset-0" />

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
        {LAYER_LABELS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={() => toggleLayer(layer.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium shadow-card",
              layers.has(layer.id)
                ? "bg-ink text-white"
                : "bg-white/95 text-ink",
            )}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {showSearchArea && onSearchArea ? (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <button
            type="button"
            onClick={handleSearchArea}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card ring-1 ring-border"
          >
            Search this area
          </button>
        </div>
      ) : null}
    </div>
  );
}
