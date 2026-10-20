"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DestinationSearch,
  buildDestinationSearchHref,
  type DestinationPlace,
} from "@/components/search/destination-search";

const COMMUTE_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
];

const BUDGET_OPTIONS = [
  { value: 8000, label: "₹8k" },
  { value: 10000, label: "₹10k" },
  { value: 15000, label: "₹15k" },
  { value: 20000, label: "₹20k" },
];

export function HeroSearch() {
  const router = useRouter();
  const [destination, setDestination] = useState<DestinationPlace | null>(null);
  const [destLabel, setDestLabel] = useState("");
  const [commuteMax, setCommuteMax] = useState(20);
  const [budgetMax, setBudgetMax] = useState(10000);
  const [mode, setMode] = useState("transit");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      buildDestinationSearchHref({
        destLat: destination?.latitude,
        destLng: destination?.longitude,
        destLabel: destination?.label || destLabel || undefined,
        budgetMax,
        commuteMax,
        mode,
      }),
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-[28px] bg-white p-3 shadow-card ring-1 ring-border sm:p-4"
    >
      <DestinationSearch
        value={destLabel}
        onSelect={(place) => {
          setDestination(place);
          setDestLabel(place.label);
        }}
        onClear={() => {
          setDestination(null);
          setDestLabel("");
        }}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block min-w-0">
          <span className="px-2 text-xs font-medium text-muted-foreground">
            Max commute
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5 px-1">
            {COMMUTE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCommuteMax(opt.value)}
                className={`h-9 rounded-full px-3 text-xs font-medium ${
                  commuteMax === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-canvas text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>

        <label className="block min-w-0">
          <span className="px-2 text-xs font-medium text-muted-foreground">
            Monthly budget
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5 px-1">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBudgetMax(opt.value)}
                className={`h-9 rounded-full px-3 text-xs font-medium ${
                  budgetMax === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-canvas text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>

        <label className="block min-w-0">
          <span className="px-2 text-xs font-medium text-muted-foreground">
            Travel by
          </span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="mt-1 h-12 w-full rounded-[20px] border-0 bg-canvas px-4 text-sm font-medium text-ink"
          >
            <option value="transit">Metro / transit</option>
            <option value="driving">Car</option>
            <option value="bicycling">Bike</option>
            <option value="walking">Walking</option>
          </select>
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full shrink-0 rounded-[20px] text-base sm:w-auto sm:self-end sm:px-8"
      >
        Explore map
      </Button>
    </form>
  );
}
