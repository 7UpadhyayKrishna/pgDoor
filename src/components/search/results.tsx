import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FilterControls, FilterForm } from "@/components/search/filters";
import { PgCard } from "@/components/search/pg-card";
import { searchFiltersSchema, searchProperties } from "@/modules/search";
import { Button } from "@/components/ui/button";

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
  const parsed = searchFiltersSchema.safeParse({
    city,
    area,
    budgetMax: blank(raw.budgetMax),
    sharing: blank(raw.sharing),
    pgType: blank(raw.pgType),
    amenities: amenities.length ? amenities : undefined,
    availability: blank(raw.availability),
    availableFrom: blank(raw.availableFrom),
    sort: blank(raw.sort),
    page: blank(raw.page),
    food: blank(raw.food),
  });
  const filters = parsed.success ? parsed.data : { city, area };
  const { results, total } = await searchProperties(filters);

  return (
    <div className="container-pg py-4 pb-24 md:py-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{heading.replace(/^PGs in /, "")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{total} PGs found</p>
      <div className="mt-4">
        <FilterControls />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-[18px] bg-white p-5 shadow-card lg:block">
          <FilterForm />
        </aside>
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((property) => (
            <PgCard key={property.id} property={property} />
          ))}
        </div>
      </div>
      {results.length === 0 ? (
        <div className="mt-8 rounded-[24px] bg-primary-soft px-6 py-10 text-center">
          <h2 className="text-lg font-semibold">No PGs found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t find PGs matching all your filters.
          </p>
          <Button asChild className="mt-4">
            <Link href={city ? `/pgs/${city}` : "/pgs"}>Clear filters</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
