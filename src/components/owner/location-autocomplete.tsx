"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SelectedPlace = {
  address: string;
  latitude: number;
  longitude: number;
  cityName: string | null;
  areaName: string | null;
};

type Suggestion = { placeId: string; description: string };

export function LocationAutocomplete({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (place: SelectedPlace) => void;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const skipFetch = useRef(false);

  useEffect(() => {
    setQuery(value);
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
      setError("");
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load suggestions");
          setSuggestions([]);
          return;
        }
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setError("Could not load suggestions");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function pick(suggestion: Suggestion) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load place");
        return;
      }
      const place = data.place as SelectedPlace;
      skipFetch.current = true;
      setQuery(place.address);
      setSuggestions([]);
      setOpen(false);
      onSelect(place);
    } catch {
      setError("Could not load place");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Label>Location</Label>
      <Input
        className="mt-1"
        value={query}
        placeholder="Search area or address"
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onBlur={() => {
          // Allow click on suggestion before closing
          setTimeout(() => setOpen(false), 150);
        }}
      />
      {loading ? <p className="mt-1 text-xs text-muted-foreground">Searching…</p> : null}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-card">
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
