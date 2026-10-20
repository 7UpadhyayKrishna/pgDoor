"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { List, Map as MapIcon, X } from "lucide-react";
import { ExploreMap } from "@/components/search/explore-map";
import { PgCard } from "@/components/search/pg-card";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/format";
import { SHARING_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { toPublicCard } from "@/modules/search";

type Card = ReturnType<typeof toPublicCard>;

export function ExploreShell({
  properties,
  destination,
}: {
  properties: Card[];
  destination?: { lat: number; lng: number; label?: string; mode?: string } | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selected = useMemo(
    () => properties.find((p) => p.id === selectedId) ?? null,
    [properties, selectedId],
  );

  function onSearchArea(bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }) {
    const next = new URLSearchParams(params.toString());
    next.set(
      "bounds",
      `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
    );
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="relative">
      {/* Mobile Map | List toggle */}
      <div className="mb-3 flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={cn(
            "flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium",
            mobileView === "list" ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-border",
          )}
        >
          <List className="h-4 w-4" /> List
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={cn(
            "flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium",
            mobileView === "map" ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-border",
          )}
        >
          <MapIcon className="h-4 w-4" /> Map
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        {/* Map */}
        <div
          className={cn(
            "h-[min(70vh,640px)] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]",
            mobileView === "list" ? "hidden lg:block" : "block",
          )}
        >
          <ExploreMap
            properties={properties}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileView("map");
            }}
            destination={destination}
            onSearchArea={onSearchArea}
            className="h-full"
          />
        </div>

        {/* List */}
        <div
          className={cn(
            "space-y-4",
            mobileView === "map" ? "hidden lg:block" : "block",
          )}
        >
          {properties.length === 0 ? (
            <p className="rounded-[18px] bg-primary-soft px-4 py-8 text-center text-sm text-muted-foreground">
              No PGs in this area. Try widening your commute or budget.
            </p>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(property.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(property.id);
                  }
                }}
                className={cn(
                  "rounded-[18px] transition ring-offset-2",
                  selectedId === property.id && "ring-2 ring-primary",
                )}
              >
                <PgCard property={property} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected PG bottom sheet (mobile) / side preview on map view */}
      {selected && mobileView === "map" ? (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-white p-4 shadow-card lg:hidden">
          <SelectedPreview property={selected} onClose={() => setSelectedId(null)} />
        </div>
      ) : null}

      {selected ? (
        <div className="fixed bottom-6 right-6 z-30 hidden w-80 rounded-[18px] bg-white p-4 shadow-card ring-1 ring-border lg:block">
          <SelectedPreview property={selected} onClose={() => setSelectedId(null)} />
        </div>
      ) : null}
    </div>
  );
}

function SelectedPreview({
  property,
  onClose,
}: {
  property: Card;
  onClose: () => void;
}) {
  const photo = property.photos[0]?.url;
  const sharing = property.roomTypes[0]?.sharingType;

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{property.name}</p>
          <p className="text-sm text-muted-foreground">
            {property.area.name}, {property.city.name}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-canvas"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-3">
        {photo ? (
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas">
            <Image src={photo} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : null}
        <div className="min-w-0 text-sm">
          <p className="font-semibold">{formatInr(property.minRent)}/mo</p>
          {property.commute ? (
            <p className="text-muted-foreground">{property.commute.text}</p>
          ) : null}
          {sharing ? (
            <p className="text-muted-foreground">{SHARING_LABEL[sharing]}</p>
          ) : null}
        </div>
      </div>
      <Button asChild className="mt-3 w-full" size="sm">
        <Link href={`/pg/${property.slug}`}>View full listing</Link>
      </Button>
    </div>
  );
}
