"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MetroLinePicker } from "@/components/search/metro-line-picker";

const AMENITIES = [
  { slug: "ac", label: "AC" },
  { slug: "wifi", label: "Wi-Fi" },
  { slug: "food", label: "Food" },
  { slug: "laundry", label: "Laundry" },
  { slug: "parking", label: "Parking" },
  { slug: "power-backup", label: "Power backup" },
  { slug: "housekeeping", label: "Housekeeping" },
];

const SORTS = [
  { value: "relevance", label: "Best match", needsDestination: false },
  { value: "true_cost", label: "True monthly cost", needsDestination: true },
  { value: "commute", label: "Shortest commute", needsDestination: true },
  { value: "rent", label: "Rent: low to high", needsDestination: false },
  { value: "rent_desc", label: "Rent: high to low", needsDestination: false },
  { value: "newest", label: "Newest", needsDestination: false },
  { value: "freshness", label: "Recently updated", needsDestination: false },
  { value: "rating", label: "Rating", needsDestination: false },
];

/** Commute sorts only mean something once a destination is set. */
function sortOptions(hasDestination: boolean) {
  return SORTS.filter((s) => hasDestination || !s.needsDestination);
}

function currentSort(params: URLSearchParams, hasDestination: boolean) {
  const raw = params.get("sort");
  const fallback = hasDestination ? "true_cost" : "relevance";
  return sortOptions(hasDestination).some((s) => s.value === raw) ? raw! : fallback;
}

/** dd/mm/yyyy (how India writes dates) <-> yyyy-mm-dd (what the URL and API use). */
function isoToDisplay(iso: string | null) {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function displayToIso(text: string) {
  const match = text.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) || date.getDate() !== Number(d) ? null : iso;
}

const COMMUTE_OPTIONS = [10, 20, 30, 45, 60, 90];
const COST_OPTIONS = [50, 100, 150, 200, 300];
const MODE_OPTIONS = [
  { value: "metro", label: "Metro" },
  { value: "bus", label: "Bus" },
  { value: "auto", label: "Auto" },
  { value: "walk", label: "Walk" },
  { value: "rapido", label: "Rapido" },
  { value: "own_vehicle", label: "Own vehicle" },
];

export function FilterControls() {
  return (
    <div className="flex gap-2 lg:hidden">
      <FilterSheet />
      <SortSheet />
    </div>
  );
}

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function apply(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return { params, apply, pathname, router };
}

export function FilterForm({
  onDone,
  showCommute = false,
}: {
  onDone?: () => void;
  showCommute?: boolean;
}) {
  const { params, apply, pathname, router } = useFilterNav();
  const [budget, setBudget] = useState(Number(params.get("budgetMax") ?? 25000));
  const [moveIn, setMoveIn] = useState(isoToDisplay(params.get("availableFrom")));
  const [moveInError, setMoveInError] = useState("");
  const hasDestination = Boolean(params.get("destLat") && params.get("destLng"));
  const commuteVisible = showCommute || hasDestination;

  function applyMoveIn() {
    if (!moveIn.trim()) {
      setMoveInError("");
      apply((n) => n.delete("availableFrom"));
      return;
    }
    const iso = displayToIso(moveIn);
    if (!iso) {
      setMoveInError("Use dd/mm/yyyy, e.g. 05/12/2026");
      return;
    }
    setMoveInError("");
    apply((n) => n.set("availableFrom", iso));
  }

  return (
    <div className="space-y-6">
      {onDone ? null : (
        <div>
          <Label htmlFor="sort-select">Sort by</Label>
          <select
            id="sort-select"
            className="mt-2 h-11 w-full rounded-[12px] border border-input bg-white px-3 text-sm"
            value={currentSort(params, hasDestination)}
            onChange={(e) => apply((n) => n.set("sort", e.target.value))}
          >
            {sortOptions(hasDestination).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label>Rent budget</Label>
        <input
          type="range"
          min={5000}
          max={25000}
          step={1000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          onMouseUp={() => apply((n) => n.set("budgetMax", String(budget)))}
          onTouchEnd={() => apply((n) => n.set("budgetMax", String(budget)))}
          className="mt-3 w-full accent-primary"
        />
        <p className="mt-1 text-sm text-muted-foreground">Rent up to ₹{budget.toLocaleString("en-IN")}</p>
      </div>
      {commuteVisible ? (
        <>
          <div>
            <Label>Max commute</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {COMMUTE_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    apply((n) => {
                      if (n.get("commuteMax") === String(mins)) n.delete("commuteMax");
                      else n.set("commuteMax", String(mins));
                    })
                  }
                  className={`min-h-11 rounded-xl border px-2 ${
                    params.get("commuteMax") === String(mins)
                      ? "border-primary bg-primary-soft text-ink"
                      : "border-input"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Max daily commute cost</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              {COST_OPTIONS.map((cost) => (
                <button
                  key={cost}
                  type="button"
                  onClick={() =>
                    apply((n) => {
                      if (n.get("maxDailyCost") === String(cost)) n.delete("maxDailyCost");
                      else n.set("maxDailyCost", String(cost));
                    })
                  }
                  className={`min-h-11 rounded-xl border px-2 ${
                    params.get("maxDailyCost") === String(cost)
                      ? "border-primary bg-primary-soft text-ink"
                      : "border-input"
                  }`}
                >
                  ₹{cost}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Arrival time</Label>
            <input
              type="time"
              defaultValue={params.get("arrivalTime") ?? "09:30"}
              onBlur={(e) => apply((n) => n.set("arrivalTime", e.target.value || "09:30"))}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
            />
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {(["weighted", "fair"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => apply((n) => n.set("rankingStyle", style))}
                  className={`min-h-11 rounded-xl border px-2 ${
                    (params.get("rankingStyle") ?? "weighted") === style
                      ? "border-primary bg-primary-soft text-ink"
                      : "border-input"
                  }`}
                >
                  {style === "fair" ? "Fair (worse commute)" : "Weighted"}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {(["peak", "offpeak"] as const).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => apply((n) => n.set("slot", slot))}
                  className={`min-h-11 rounded-xl border px-2 ${
                    (params.get("slot") ?? "peak") === slot
                      ? "border-primary bg-primary-soft text-ink"
                      : "border-input"
                  }`}
                >
                  {slot === "peak" ? "Peak" : "Off-peak"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Travel mode</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    apply((n) => {
                      n.set("mode", opt.value);
                      if (!n.get("sort") || n.get("sort") === "relevance") {
                        n.set("sort", "true_cost");
                      }
                    })
                  }
                  className={`min-h-11 rounded-xl border px-2 ${
                    (params.get("mode") ?? "metro") === opt.value
                      ? "border-primary bg-primary-soft text-ink"
                      : "border-input"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <div>
        <Label>Room type</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {["SINGLE", "DOUBLE", "TRIPLE", "FOUR"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                apply((n) => {
                  if (n.get("sharing") === type) n.delete("sharing");
                  else n.set("sharing", type);
                })
              }
              className={`min-h-11 rounded-xl border px-2 ${
                params.get("sharing") === type
                  ? "border-primary bg-primary-soft text-ink"
                  : "border-input"
              }`}
            >
              {type[0] + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>PG for</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {[
            { value: "BOYS", label: "Boys" },
            { value: "GIRLS", label: "Girls" },
            { value: "UNISEX", label: "Unisex" },
            { value: "CO_LIVING", label: "Co-living" },
          ].map(({ value: type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                apply((n) => {
                  if (n.get("pgType") === type) n.delete("pgType");
                  else n.set("pgType", type);
                })
              }
              className={`min-h-11 rounded-xl border px-2 ${
                params.get("pgType") === type
                  ? "border-primary bg-primary-soft text-ink"
                  : "border-input"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="move-in-date">Move-in date</Label>
        <input
          id="move-in-date"
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          className="mt-2 h-11 w-full rounded-[12px] border border-input bg-white px-3 text-sm"
          value={moveIn}
          onChange={(e) => setMoveIn(e.target.value.replace(/[^\d/.-]/g, "").slice(0, 10))}
          onBlur={applyMoveIn}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyMoveIn();
          }}
          aria-invalid={Boolean(moveInError)}
          aria-describedby={moveInError ? "move-in-error" : undefined}
        />
        {moveInError ? (
          <p id="move-in-error" className="mt-1 text-xs text-error">
            {moveInError}
          </p>
        ) : null}
      </div>
      <MetroLinePicker />
      <div>
        <Label>Amenities</Label>
        <ul className="mt-2 space-y-2 text-sm">
          {AMENITIES.map((a) => (
            <li key={a.slug}>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={params.getAll("amenities").includes(a.slug)}
                  onChange={() =>
                    apply((n) => {
                      const current = n.getAll("amenities");
                      n.delete("amenities");
                      const next = current.includes(a.slug)
                        ? current.filter((s) => s !== a.slug)
                        : [...current, a.slug];
                      next.forEach((s) => n.append("amenities", s));
                    })
                  }
                />
                {a.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            router.push(pathname);
            onDone?.();
          }}
        >
          Clear all
        </Button>
        {onDone ? (
          <Button className="flex-1" onClick={onDone}>
            Show results
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FilterSheet() {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  const showCommute = Boolean(params.get("destLat") && params.get("destLng"));
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex-1">
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Filters</SheetTitle>
        <div className="mt-4">
          <FilterForm onDone={() => setOpen(false)} showCommute={showCommute} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SortSheet() {
  const { params, apply } = useFilterNav();
  const hasDestination = Boolean(params.get("destLat") && params.get("destLng"));
  const active = currentSort(params, hasDestination);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex-1">
          Sort
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Sort by</SheetTitle>
        <ul className="mt-4 space-y-2">
          {sortOptions(hasDestination).map((s) => (
            <li key={s.value}>
              <button
                type="button"
                onClick={() => apply((n) => n.set("sort", s.value))}
                className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm ${
                  active === s.value
                    ? "bg-primary-soft font-semibold"
                    : ""
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
