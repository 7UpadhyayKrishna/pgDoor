"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPARE_LIMIT } from "@/lib/constants";
import { clearCompare, removeCompare, useCompareItems } from "@/lib/compare-store";

/** Search params that describe the seeker's requirements and carry over to /compare. */
const REQUIREMENT_PARAMS = [
  "budgetMax",
  "sharing",
  "pgType",
  "food",
  "amenities",
  "availableFrom",
  "commuteMax",
  "mode",
  "destLat",
  "destLng",
  "destLabel",
];

export function compareHref(params: URLSearchParams) {
  const next = new URLSearchParams();
  for (const key of REQUIREMENT_PARAMS) {
    for (const value of params.getAll(key)) next.append(key, value);
  }
  const qs = next.toString();
  return qs ? `/compare?${qs}` : "/compare";
}

export function CompareTray() {
  const items = useCompareItems();
  const params = useSearchParams();
  if (items.length === 0) return null;

  const ready = items.length >= COMPARE_LIMIT;

  return (
    <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[18px] bg-white p-3 shadow-card ring-1 ring-border">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">
          Compare {items.length}/{COMPARE_LIMIT}
        </p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item.slug}
              className="flex max-w-[11rem] items-center gap-1 rounded-full bg-canvas py-0.5 pl-2.5 pr-1 text-xs font-medium"
            >
              <span className="truncate">{item.name}</span>
              <button
                type="button"
                aria-label={`Remove ${item.name} from compare`}
                onClick={() => removeCompare(item.slug)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {ready ? (
          <Button asChild size="sm">
            <Link href={compareHref(params)}>Compare now</Link>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Pick one more</span>
        )}
        <button
          type="button"
          onClick={clearCompare}
          className="text-xs font-medium text-muted-foreground hover:text-ink"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
