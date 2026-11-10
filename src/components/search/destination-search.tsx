"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type DestinationPlace = {
  placeId: string;
  label: string;
  latitude: number;
  longitude: number;
  slug?: string;
};

type Suggestion = {
  placeId: string;
  description: string;
  latitude?: number;
  longitude?: number;
  seeded?: boolean;
  slug?: string;
};

export function DestinationSearch({
  value,
  onSelect,
  onClear,
  className,
  placeholder = "Office, college, coaching or metro",
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
  const [interacted, setInteracted] = useState(false);
  const skipFetch = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  // Suggestions load only once the tenant focuses or types, so the list never covers
  // the commute and budget controls on page load.
  useEffect(() => {
    if (!interacted) return;
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/destinations/suggest?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setSuggestions(data.suggestions ?? []);
          if (document.activeElement === inputRef.current) setOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, interacted]);

  async function pick(suggestion: Suggestion) {
    if (suggestion.latitude != null && suggestion.longitude != null) {
      skipFetch.current = true;
      setQuery(suggestion.description);
      setSuggestions([]);
      setOpen(false);
      onSelect({
        placeId: suggestion.placeId,
        label: suggestion.description,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        slug: suggestion.slug,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/destinations/resolve?placeId=${encodeURIComponent(suggestion.placeId)}&label=${encodeURIComponent(suggestion.description)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.place) return;
      skipFetch.current = true;
      setQuery(suggestion.description);
      setSuggestions([]);
      setOpen(false);
      onSelect({
        placeId: data.place.placeId,
        label: data.place.label,
        latitude: data.place.latitude,
        longitude: data.place.longitude,
        slug: data.place.slug,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <span className="px-2 text-xs font-medium text-muted-foreground">
        Where do you go every day?
      </span>
      <div className="relative mt-1">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => {
            setInteracted(true);
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onClear?.();
          }}
          onFocus={() => {
            setInteracted(true);
            if (suggestions.length) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-12 w-full rounded-[20px] border-0 bg-canvas pl-9 pr-4 text-sm font-medium text-ink"
        />
      </div>
      {loading && open ? (
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
                {s.seeded ? (
                  <span className="ml-2 text-xs text-muted-foreground">popular</span>
                ) : null}
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
  maxDailyCost?: number;
}) {
  const params = new URLSearchParams();
  if (opts.destLat != null && opts.destLng != null) {
    params.set("destLat", String(opts.destLat));
    params.set("destLng", String(opts.destLng));
  }
  if (opts.destLabel) params.set("destLabel", opts.destLabel);
  if (opts.budgetMax) params.set("budgetMax", String(opts.budgetMax));
  if (opts.commuteMax) params.set("commuteMax", String(opts.commuteMax));
  if (opts.maxDailyCost != null) params.set("maxDailyCost", String(opts.maxDailyCost));
  if (opts.mode) params.set("mode", opts.mode);
  if (opts.availableFrom) params.set("availableFrom", opts.availableFrom);
  if (opts.destLat != null) params.set("sort", "true_cost");
  const qs = params.toString();
  return qs ? `/pgs?${qs}` : "/pgs";
}
