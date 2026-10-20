"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type DestinationPlace = {
  placeId: string;
  label: string;
  latitude: number;
  longitude: number;
};

type Suggestion = { placeId: string; description: string };

export function DestinationSearch({
  value,
  onSelect,
  onClear,
  className,
  placeholder = "Office, college, university or landmark",
}: {
  value?: string;
  onSelect: (place: DestinationPlace) => void;
  onClear?: () => void;
  className?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const skipFetch = useRef(false);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(q)}&destination=1`,
        );
        const data = await res.json();
        if (res.ok) {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function pick(suggestion: Suggestion) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.place) return;
      const place = data.place as {
        placeId: string;
        address: string;
        latitude: number;
        longitude: number;
      };
      skipFetch.current = true;
      setQuery(suggestion.description);
      setSuggestions([]);
      setOpen(false);
      onSelect({
        placeId: place.placeId,
        label: suggestion.description,
        latitude: place.latitude,
        longitude: place.longitude,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <span className="px-2 text-xs font-medium text-muted-foreground">
        Where do you want to live near?
      </span>
      <div className="relative mt-1">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onClear?.();
          }}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-12 w-full rounded-[20px] border-0 bg-canvas pl-9 pr-4 text-sm font-medium text-ink"
        />
      </div>
      {loading ? (
        <p className="mt-1 px-2 text-xs text-muted-foreground">Searching…</p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-card">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-canvas"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function buildDestinationSearchHref(opts: {
  destLat?: number;
  destLng?: number;
  destLabel?: string;
  budgetMax?: number;
  commuteMax?: number;
  mode?: string;
  availableFrom?: string;
}) {
  const params = new URLSearchParams();
  if (opts.destLat != null && opts.destLng != null) {
    params.set("destLat", String(opts.destLat));
    params.set("destLng", String(opts.destLng));
  }
  if (opts.destLabel) params.set("destLabel", opts.destLabel);
  if (opts.budgetMax) params.set("budgetMax", String(opts.budgetMax));
  if (opts.commuteMax) params.set("commuteMax", String(opts.commuteMax));
  if (opts.mode) params.set("mode", opts.mode);
  if (opts.availableFrom) params.set("availableFrom", opts.availableFrom);
  if (opts.destLat != null) params.set("sort", "commute");
  const qs = params.toString();
  return qs ? `/pgs?${qs}` : "/pgs";
}
