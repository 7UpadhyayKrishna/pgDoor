"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Navigation, X } from "lucide-react";
import { CompareTray } from "@/components/search/compare-tray";
import { ExploreMap } from "@/components/search/explore-map";
import { PgCard, PgTypeBadge } from "@/components/search/pg-card";
import {
  parseView,
  useIsDesktop,
  ViewToggle,
  type ResultsView,
} from "@/components/search/view-toggle";
import { Button } from "@/components/ui/button";
import { toggleCompare, useCompareItems } from "@/lib/compare-store";
import { distanceLine, googleDirectionsUrl, listingHref, type Origin } from "@/lib/directions";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MapPin, toPublicCard } from "@/modules/search";

type Card = ReturnType<typeof toPublicCard>;

export function ExploreShell({
  properties,
  pins,
  page,
  pageSize,
  total,
  destination,
}: {
  properties: Card[];
  pins: MapPin[];
  page: number;
  pageSize: number;
  total: number;
  destination?: { lat: number; lng: number; label?: string; mode?: string } | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const isDesktop = useIsDesktop();

  // No ?view yet: CSS decides (split on desktop, list on mobile) so the first paint doesn't jump.
  const explicitView = parseView(params.get("view"));
  const view: ResultsView = explicitView ?? (isDesktop ? "split" : "list");
  const layout = explicitView ?? "auto";
  const showMap = view !== "list";
  const showList = view !== "map";

  const origin: Origin | null = destination
    ? { lat: destination.lat, lng: destination.lng, label: destination.label, mode: destination.mode }
    : null;

  const selected = useMemo(
    () => pins.find((p) => p.id === selectedId) ?? null,
    [pins, selectedId],
  );
  const selectedOnPage = Boolean(selectedId && properties.some((p) => p.id === selectedId));
  const showPreview = Boolean(selected) && (view === "map" || !selectedOnPage);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function setView(next: ResultsView) {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("view", next);
    // Native history update: keeps filters/sort/location and skips a server round-trip.
    window.history.replaceState(null, "", `${pathname}?${nextParams.toString()}`);
  }

  const onPinSelect = useCallback((id: string) => {
    setSelectedId(id);
    cardRefs.current.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  function pageHref(target: number) {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

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
      <div
        className={cn(
          layout === "split" || layout === "auto"
            ? "grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start"
            : "block",
        )}
      >
        {showMap ? (
          <div
            className={cn(
              layout === "map" && "h-[calc(100vh-15rem)] min-h-[420px]",
              layout === "split" && "h-[45vh] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]",
              layout === "auto" && "hidden lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)]",
            )}
          >
            <ExploreMap
              pins={pins}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={onPinSelect}
              destination={destination}
              onSearchArea={onSearchArea}
              className="h-full"
            />
          </div>
        ) : null}

        {showList ? (
          <div className="min-w-0">
            <div
              className={cn(
                "grid gap-4",
                layout === "list" && "sm:grid-cols-2 xl:grid-cols-3",
                layout === "auto" && "sm:grid-cols-2 lg:grid-cols-1",
              )}
            >
              {properties.length === 0 ? (
                <p className="rounded-[18px] bg-primary-soft px-4 py-8 text-center text-sm text-muted-foreground sm:col-span-full">
                  No PGs in this area. Try widening your commute or budget.
                </p>
              ) : (
                properties.map((property) => (
                  <div
                    key={property.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(property.id, el);
                      else cardRefs.current.delete(property.id);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedId === property.id}
                    onClick={() => setSelectedId(property.id)}
                    onMouseEnter={() => setHoveredId(property.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(property.id);
                      }
                    }}
                    className={cn(
                      "scroll-mt-24 rounded-[18px] transition ring-offset-2",
                      selectedId === property.id && "ring-2 ring-primary",
                    )}
                  >
                    <PgCard property={property} origin={origin} compare />
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 ? (
              <nav
                aria-label="Search results pages"
                className="flex items-center justify-between gap-3 pt-6"
              >
                <PageLink href={pageHref(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </PageLink>
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, total)} of {total}
                </p>
                <PageLink href={pageHref(page + 1)} disabled={page >= totalPages}>
                  Next <ChevronRight className="h-4 w-4" />
                </PageLink>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Desktop preview for a pin whose card isn't visible */}
      {selected && showPreview ? (
        <div className="fixed bottom-24 right-6 z-30 hidden w-80 rounded-[18px] bg-white p-4 shadow-card ring-1 ring-border lg:block">
          <SelectedPreview property={selected} origin={origin} onClose={() => setSelectedId(null)} />
        </div>
      ) : null}

      {/* Bottom stack: mobile preview, compare tray, view toggle */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[4.5rem] z-30 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {selected && showPreview ? (
          <div className="pointer-events-auto w-full max-w-md rounded-[18px] bg-white p-4 shadow-card ring-1 ring-border lg:hidden">
            <SelectedPreview property={selected} origin={origin} onClose={() => setSelectedId(null)} />
          </div>
        ) : null}
        <CompareTray />
        <ViewToggle view={view} onChange={setView} />
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const className =
    "inline-flex h-10 items-center gap-1 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-border";
  if (disabled) {
    return (
      <span aria-disabled className={cn(className, "cursor-not-allowed opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} scroll className={cn(className, "hover:bg-canvas")}>
      {children}
    </Link>
  );
}

function SelectedPreview({
  property,
  origin,
  onClose,
}: {
  property: MapPin;
  origin: Origin | null;
  onClose: () => void;
}) {
  const photo = property.photo;
  const compareItems = useCompareItems();
  const inCompare = compareItems.some((item) => item.slug === property.slug);
  const distance = distanceLine({
    distanceKm: property.distanceKm,
    minutes: property.commuteMinutes,
    mode: origin?.mode,
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{property.name}</p>
          <p className="text-sm text-muted-foreground">
            {property.areaName}, {property.cityName}
          </p>
          <PgTypeBadge pgType={property.pgType} />
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
          {distance ? <p className="text-primary">{distance}</p> : null}
          {origin ? (
            <a
              href={googleDirectionsUrl(origin, property)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button asChild className="flex-1" size="sm">
          <Link href={listingHref(property.slug, origin)}>View full listing</Link>
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={inCompare}
            onChange={() => toggleCompare({ slug: property.slug, name: property.name })}
            className="h-4 w-4 accent-primary"
          />
          Compare
        </label>
      </div>
    </div>
  );
}
