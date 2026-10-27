"use client";

import { useSyncExternalStore } from "react";
import { Columns2, List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResultsView = "list" | "map" | "split";

const VIEWS: { id: ResultsView; label: string; icon: typeof List }[] = [
  { id: "list", label: "List", icon: List },
  { id: "split", label: "Split", icon: Columns2 },
  { id: "map", label: "Map", icon: MapIcon },
];

export function parseView(value: string | null): ResultsView | null {
  return value === "list" || value === "map" || value === "split" ? value : null;
}

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

export function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export function ViewToggle({
  view,
  onChange,
}: {
  view: ResultsView;
  onChange: (view: ResultsView) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Results view"
      className="pointer-events-auto flex rounded-full bg-ink p-1 shadow-card"
    >
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={view === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
            view === id ? "bg-white text-ink" : "text-white/80 hover:text-white",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
