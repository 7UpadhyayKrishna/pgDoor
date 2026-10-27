import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { FilterControls, FilterForm } from "@/components/search/filters";
import { NearbyPlaces } from "@/components/search/nearby-places";
import { PreferredLocation } from "@/components/search/preferred-location";
import { ExploreShell } from "@/components/search/explore-shell";
import { searchFiltersSchema, searchProperties } from "@/modules/search";
import { getAreaBySlugs, getNearbyForArea } from "@/modules/locations";
import { Button } from "@/components/ui/button";
import { PgCardSkeleton } from "@/components/search/pg-card-skeleton";

export const dynamic = "force-dynamic";

export async function SearchResults({
  city,
  area,
  raw,
  heading,
}: {
  city?: string;
  area?: string;
  raw: Record<string, string | string[] | undefined>;
  heading: string;
}) {
  const amenities = Array.isArray(raw.amenities)
    ? raw.amenities
    : raw.amenities
      ? [raw.amenities]
      : [];
  const blank = (value: string | string[] | undefined) =>
    !value || value === "" ? undefined : value;
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const qParam = single(raw.q);
  const q = qParam && qParam !== "" ? qParam : undefined;
  const parsed = searchFiltersSchema.safeParse({
    city,
    area,
    q,
    budgetMax: blank(raw.budgetMax),
    sharing: blank(raw.sharing),
    pgType: blank(raw.pgType),
    amenities: amenities.length ? amenities : undefined,
    availability: blank(raw.availability),
    availableFrom: blank(raw.availableFrom),
    sort: blank(raw.sort),
    page: blank(raw.page),
    food: blank(raw.food),
    destLat: blank(raw.destLat),
    destLng: blank(raw.destLng),
    destLabel: blank(raw.destLabel),
    commuteMax: blank(raw.commuteMax),
    mode: blank(raw.mode),
    radiusKm: blank(raw.radiusKm),
    bounds: blank(raw.bounds),
    near: blank(raw.near),
  });
  const filters = parsed.success ? parsed.data : { city, area, q };

  const [search, nearby] = await Promise.all([
    searchProperties(filters),
    city && area
      ? getAreaBySlugs(city, area).then(async (record) => {
          if (!record) return null;
          return getNearbyForArea(record.id);
        })
      : Promise.resolve(null),
  ]);

  const { results, pins, total, page, pageSize, destination } = search;
  const destLabel = single(raw.destLabel)?.trim();
  const hasDestination = Boolean(destination?.lat && destination?.lng);
  const displayHeading = destLabel
    ? `PGs near ${destLabel}`
    : q
      ? `PGs near “${q}”`
      : heading.replace(/^PGs in /, "");

  return (
    <div className="container-pg py-4 pb-48 md:py-8 md:pb-40">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to homepage"
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{displayHeading}</h1>
          {hasDestination && filters.commuteMax ? (
            <p className="text-sm text-muted-foreground">
              Within {filters.commuteMax} min
              {filters.mode ? ` by ${filters.mode}` : ""}
              {filters.budgetMax
                ? ` · under ₹${filters.budgetMax.toLocaleString("en-IN")}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{total} PGs found</p>
      <div className="mt-3">
        <Suspense fallback={null}>
          <PreferredLocation />
        </Suspense>
      </div>
      <div className="mt-4">
        <Suspense fallback={null}>
          <FilterControls />
        </Suspense>
      </div>

      {nearby && !hasDestination ? (
        <div className="mt-6">
          <NearbyPlaces areaName={nearby.areaName} places={nearby.places} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden h-fit rounded-[18px] bg-white p-5 shadow-card lg:block">
          <FilterForm showCommute={hasDestination || Boolean(filters.commuteMax)} />
        </aside>
        <div className="min-w-0">
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2">
                <PgCardSkeleton />
                <PgCardSkeleton />
              </div>
            }
          >
            <ExploreShell
              properties={results}
              pins={pins}
              page={page}
              pageSize={pageSize}
              total={total}
              destination={destination}
            />
          </Suspense>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-4 rounded-[24px] bg-primary-soft px-6 py-10 text-center lg:col-span-2">
          <h2 className="text-lg font-semibold">No PGs found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a longer commute, higher budget, or search this area on the map.
          </p>
          <Button asChild className="mt-4">
            <Link href={city ? `/pgs/${city}` : "/pgs"}>Clear filters</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
