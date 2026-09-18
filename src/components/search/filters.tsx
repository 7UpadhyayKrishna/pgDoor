"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  { value: "relevance", label: "Recommended" },
  { value: "rent", label: "Price: Low to High" },
  { value: "rent_desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
  { value: "freshness", label: "Recently Updated" },
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

export function FilterForm({ onDone }: { onDone?: () => void }) {
  const { params, apply, pathname, router } = useFilterNav();
  const [budget, setBudget] = useState(Number(params.get("budgetMax") ?? 25000));

  return (
    <div className="space-y-6">
      <div>
        <Label>Budget</Label>
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
        <p className="mt-1 text-sm text-muted-foreground">Up to ₹{budget.toLocaleString("en-IN")}</p>
      </div>
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
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
          {["BOYS", "GIRLS", "UNISEX"].map((type) => (
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
              {type[0] + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Move-in date</Label>
        <input
          type="date"
          className="mt-2 h-11 w-full rounded-[12px] border border-input px-3 text-sm"
          defaultValue={params.get("availableFrom") ?? ""}
          onChange={(e) =>
            apply((n) => {
              if (!e.target.value) n.delete("availableFrom");
              else n.set("availableFrom", e.target.value);
            })
          }
        />
      </div>
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
          <FilterForm onDone={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SortSheet() {
  const { params, apply } = useFilterNav();
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
          {SORTS.map((s) => (
            <li key={s.value}>
              <button
                type="button"
                onClick={() => apply((n) => n.set("sort", s.value))}
                className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm ${
                  (params.get("sort") ?? "relevance") === s.value
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
