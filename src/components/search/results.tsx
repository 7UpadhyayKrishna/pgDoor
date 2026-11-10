import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FilterControls, FilterForm } from "@/components/search/filters";
import { NearbyPlaces } from "@/components/search/nearby-places";
import { PreferredLocation } from "@/components/search/preferred-location";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { ExploreShell } from "@/components/search/explore-shell";
import { searchFiltersSchema, searchProperties } from "@/modules/search";
import { getAreaBySlugs, getNearbyForArea } from "@/modules/locations";
import { Button } from "@/components/ui/button";
import { PgCardSkeleton } from "@/components/search/pg-card-skeleton";
import { modeText } from "@/lib/directions";

export const dynamic = "force-dynamic";

/** Params that only change presentation, not which PGs match. */
const PRESENTATION_PARAMS = new Set(["view", "page", "sort"]);

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
  const qParam = single(raw.q)?.trim();
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
    maxDailyCost: blank(raw.maxDailyCost),
    arrivalTime: blank(raw.arrivalTime),
    commuteDays: blank(raw.commuteDays),
    slot: blank(raw.slot),
    rankingStyle: blank(raw.rankingStyle),
    dests: blank(raw.dests),
    metroLine: blank(raw.metroLine),
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
  const basePath = city && area ? `/pgs/${city}/${area}` : city ? `/pgs/${city}` : "/pgs";
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (page > lastPage) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      if (key === "page" || value == null) continue;
      for (const v of Array.isArray(value) ? value : [value]) next.append(key, v);
    }
    if (lastPage > 1) next.set("page", String(lastPage));
    const qs = next.toString();
    redirect(qs ? `${basePath}?${qs}` : basePath);
  }

  const destLabel = single(raw.destLabel)?.trim();
  const hasDestination = Boolean(destination?.lat && destination?.lng);
  const nameSearch = Boolean(q) && !hasDestination;
  const placeName = heading.replace(/^PGs in /, "");
  const displayHeading = destLabel
    ? `PGs near ${destLabel}`
    : nameSearch
      ? `Results for “${q}”`
      : placeName;
  const hasUserFilters = Object.entries(raw).some(
    ([key, value]) => !PRESENTATION_PARAMS.has(key) && Boolean(single(value)),
  );
  const comingSoon = Boolean(city) && !area && total === 0 && !hasUserFilters;
  const countLabel = `${total} ${total === 1 ? "PG" : "PGs"} found`;

  const emptyState = comingSoon ? (
    <EmptyBlock
      title={`Coming soon to ${placeName}`}
      body={`We don't have PGs listed in ${placeName} yet. Owners are onboarding now; browse what's live in Gurgaon meanwhile.`}
      href="/pgs/gurgaon"
      cta="Browse PGs in Gurgaon"
    />
  ) : nameSearch ? (
    <EmptyBlock
      title={`No PG or area matches “${q}”`}
      body="Check the spelling, or try a PG name, brand, sector or locality."
      href="/pgs"
      cta="Browse all PGs"
    />
  ) : (
    <EmptyBlock
      title="No PGs found"
      body={
        hasDestination
          ? "Try a longer commute, a higher budget, or search this area on the map."
          : "Try removing a filter or raising your budget."
      }
      href={basePath}
      cta="Clear filters"
    />
  );

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
              {`Within ${filters.commuteMax} min ${filters.mode ? modeText(filters.mode) : ""}`.trim()}
              {filters.budgetMax
                ? ` · rent under ₹${filters.budgetMax.toLocaleString("en-IN")}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
      {comingSoon ? null : <p className="mt-1 text-sm text-muted-foreground">{countLabel}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Suspense fallback={null}>
          <PreferredLocation />
        </Suspense>
        <Suspense fallback={null}>
          <SaveSearchButton />
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
              emptyState={emptyState}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function EmptyBlock({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[24px] bg-primary-soft px-6 py-10 text-center sm:col-span-full">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-4">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
