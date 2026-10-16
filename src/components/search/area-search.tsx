"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  name: string;
  slug: string;
  cityName: string;
  citySlug: string;
  score: number;
  href: string;
};

export function buildAreaSearchHref(query: string, availableFrom?: string) {
  const q = query.trim();
  if (!q) {
    return availableFrom ? `/pgs?availableFrom=${encodeURIComponent(availableFrom)}` : "/pgs";
  }
  const base = `/pgs?q=${encodeURIComponent(q)}`;
  if (!availableFrom) return base;
  return `${base}&availableFrom=${encodeURIComponent(availableFrom)}`;
}

export function AreaSearch({
  variant = "header",
  placeholder = "Search by area",
  className,
  availableFrom,
  value,
  onValueChange,
}: {
  variant?: "header" | "hero";
  placeholder?: string;
  className?: string;
  availableFrom?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [internalQuery, setInternalQuery] = useState("");
  const query = value ?? internalQuery;
  const setQuery = (next: string) => {
    if (onValueChange) onValueChange(next);
    else setInternalQuery(next);
  };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (res.ok) {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
          setActiveIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function withAvailableFrom(href: string) {
    if (!availableFrom) return href;
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}availableFrom=${encodeURIComponent(availableFrom)}`;
  }

  function go(href: string) {
    router.push(withAvailableFrom(href));
    setOpen(false);
  }

  function submitFreeText() {
    const q = query.trim();
    if (!q) return;
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      go(suggestions[activeIndex].href);
      return;
    }
    go(buildAreaSearchHref(q));
  }

  const isHero = variant === "hero";

  return (
    <div ref={wrapRef} className={cn("relative min-w-0", className)}>
      <label className="block min-w-0">
        {isHero ? (
          <span className="block px-2 text-xs font-medium text-muted-foreground">
            Where do you want to live?
          </span>
        ) : (
          <span className="sr-only">Search by area</span>
        )}
        <div className={cn("relative flex items-center", isHero && "mt-1")}>
          {!isHero ? (
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          ) : null}
          <input
            type="search"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
            }
            className={cn(
              "w-full text-sm font-medium text-ink outline-none",
              isHero
                ? "h-12 rounded-[20px] border-0 bg-canvas px-4"
                : "h-10 rounded-full border border-border bg-canvas pl-9 pr-3",
            )}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (!suggestions.length) return;
                setOpen(true);
                setActiveIndex((i) => (i + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (!suggestions.length) return;
                setOpen(true);
                setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                submitFreeText();
              } else if (e.key === "Escape") {
                setOpen(false);
                setActiveIndex(-1);
              }
            }}
          />
        </div>
      </label>
      {loading && isHero ? (
        <p className="mt-1 px-2 text-xs text-muted-foreground">Searching…</p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-card"
        >
          {suggestions.map((s, index) => (
            <li key={`${s.citySlug}-${s.slug}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                id={`${listId}-opt-${index}`}
                className={cn(
                  "w-full px-3 py-2.5 text-left text-sm hover:bg-canvas",
                  index === activeIndex && "bg-canvas",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(s.name);
                  go(s.href);
                }}
              >
                <span className="font-medium text-ink">{s.name}</span>
                <span className="text-muted-foreground"> · {s.cityName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
