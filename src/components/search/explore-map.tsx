"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMaps, formatRentPin, getMapsBrowserKey } from "@/lib/google-maps";
import type { MapPin } from "@/modules/search";
import type { MapPoiLayer } from "@/lib/places";
import { PG_TYPE_COLOR, PG_TYPE_LEGEND } from "@/lib/pg-type-colors";
import { cn } from "@/lib/utils";

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

function createPricePinElement(pin: MapPin, highlighted: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = formatRentPin(pin.minRent);
  el.style.cssText = [
    "border:2px solid #fff",
    "cursor:pointer",
    "font:600 12px/1 system-ui,sans-serif",
    "padding:5px 9px",
    "border-radius:999px",
    "white-space:nowrap",
    "color:#fff",
    `background:${PG_TYPE_COLOR[pin.pgType]}`,
    highlighted
      ? "transform:scale(1.2);box-shadow:0 0 0 3px #1a1a1a,0 4px 12px rgba(0,0,0,.3)"
      : "box-shadow:0 2px 8px rgba(0,0,0,.18)",
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
  pins,
  selectedId,
  hoveredId = null,
  onSelect,
  destination,
  onSearchArea,
  className,
}: {
  pins: MapPin[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelect: (id: string) => void;
  destination?: { lat: number; lng: number; label?: string } | null;
  onSearchArea?: (bounds: { south: number; west: number; north: number; east: number }) => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const styledIds = useRef<Set<string>>(new Set());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
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

  const selected = pins.find((p) => p.id === selectedId) ?? null;

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
        : pins[0]
          ? { lat: pins[0].latitude, lng: pins[0].longitude }
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
    markersRef.current = new Map();
    clustererRef.current?.clearMarkers();
    styledIds.current = new Set();

    const markers = pins.map((p) => {
      const marker = new AdvancedMarkerElement({
        map: null,
        position: { lat: p.latitude, lng: p.longitude },
        content: createPricePinElement(p, false),
        title: p.name,
        zIndex: 1,
      });
      marker.addListener("click", () => onSelectRef.current(p.id));
      markersRef.current.set(p.id, marker);
      return marker;
    });

    clustererRef.current = new MarkerClusterer({ map, markers });

    if (pins.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      pins.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      if (destination) bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds, 64);
    }
  }, [ready, pins, destination]);

  // Restyle only pins whose highlight changed (selected or hovered in the list)
  useEffect(() => {
    if (!ready) return;
    const next = new Set([selectedId, hoveredId].filter((id): id is string => Boolean(id)));
    const restyle = (id: string, highlighted: boolean) => {
      const marker = markersRef.current.get(id);
      const pin = pins.find((p) => p.id === id);
      if (!marker || !pin) return;
      marker.content = createPricePinElement(pin, highlighted);
      marker.zIndex = highlighted ? 10 : 1;
    };
    styledIds.current.forEach((id) => {
      if (!next.has(id)) restyle(id, false);
    });
    next.forEach((id) => {
      if (!styledIds.current.has(id)) restyle(id, true);
    });
    styledIds.current = next;
  }, [selectedId, hoveredId, ready, pins]);

  // Pan to the selected pin
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    if (!selected) return;
    mapInstance.current.panTo({ lat: selected.latitude, lng: selected.longitude });
    if ((mapInstance.current.getZoom() ?? 12) < 14) {
      mapInstance.current.setZoom(14);
    }
  }, [selected, ready]);

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
  }, [ready, showSearchArea, pins.length]);

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
        : pins[0]
          ? { lat: pins[0].latitude, lng: pins[0].longitude }
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
  }, [ready, layers, selected, destination, pins]);

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

      <ul
        aria-label="Map legend"
        className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 rounded-xl bg-white/95 px-2.5 py-2 text-xs font-medium text-ink shadow-card"
      >
        {PG_TYPE_LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>

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
