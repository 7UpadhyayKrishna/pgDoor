"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = { latitude: number; longitude: number };

const PIN_HTML =
  '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--primary-hover);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>';

/** OpenStreetMap pin picker: click the map or drag the pin. Needs no API key. */
export function PinPicker({
  value,
  fallbackCenter,
  onChange,
}: {
  value: LatLng | null;
  fallbackCenter: LatLng;
  onChange: (point: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const placePinRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const initial = useRef({ value, fallbackCenter });
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      const start = initial.current.value ?? initial.current.fallbackCenter;
      map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [start.latitude, start.longitude],
        initial.current.value ? 17 : 12,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({ html: PIN_HTML, className: "", iconSize: [28, 28], iconAnchor: [14, 28] });
      const place = (lat: number, lng: number) => {
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng], { draggable: true, icon }).addTo(map!);
          markerRef.current.on("dragend", () => {
            const p = markerRef.current!.getLatLng();
            onChangeRef.current({ latitude: p.lat, longitude: p.lng });
          });
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
      };
      if (initial.current.value) place(initial.current.value.latitude, initial.current.value.longitude);

      map.on("click", (event) => {
        place(event.latlng.lat, event.latlng.lng);
        onChangeRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
      mapRef.current = map;
      placePinRef.current = place;
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
      placePinRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    const current = markerRef.current?.getLatLng();
    if (current && Math.abs(current.lat - value.latitude) < 1e-7 && Math.abs(current.lng - value.longitude) < 1e-7) {
      return;
    }
    placePinRef.current?.(value.latitude, value.longitude);
    map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 16));
  }, [value]);

  useEffect(() => {
    if (value || !mapRef.current) return;
    mapRef.current.setView([fallbackCenter.latitude, fallbackCenter.longitude], 12);
  }, [fallbackCenter.latitude, fallbackCenter.longitude, value]);

  return <div ref={containerRef} className="relative z-0 h-64 w-full sm:h-72" />;
}
