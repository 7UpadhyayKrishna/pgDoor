import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SearchResults } from "@/components/search/results";
import { Button } from "@/components/ui/button";
import { CITY_SLUG_ALIASES, COMING_SOON_CITIES } from "@/lib/cities";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { getCityBySlug } from "@/modules/locations";

export const dynamic = "force-dynamic";

async function cityStats(cityId: string) {
  const stats = await prisma.property.aggregate({
    where: { cityId, status: "PUBLISHED" },
    _count: true,
    _min: { minRent: true },
  });
  return { count: stats._count, minRent: stats._min.minRent };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const record = await getCityBySlug(city);
  if (!record) {
    const soon = COMING_SOON_CITIES[city];
    return soon ? { title: `PGs in ${soon} — coming soon`, robots: { index: false } } : {};
  }
  const { count, minRent } = await cityStats(record.id);
  const title = count
    ? `${count} PGs in ${record.name}${minRent ? ` from ${formatInr(minRent)}` : ""}`
    : `PGs in ${record.name} — coming soon`;
  const description = count
    ? `Compare ${count} PGs in ${record.name} by commute time, rent and true monthly cost. Boys, girls and co-living PGs with photos and house rules.`
    : `pgDoor is onboarding PGs in ${record.name}. Browse live PGs in Gurgaon meanwhile.`;
  const url = `/pgs/${record.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    robots: count ? undefined : { index: false },
  };
}

export default async function CityPgsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { city } = await params;
  const alias = CITY_SLUG_ALIASES[city];
  if (alias) permanentRedirect(`/pgs/${alias}`);
  const raw = await searchParams;
  const record = await getCityBySlug(city);
  if (!record) {
    const soon = COMING_SOON_CITIES[city];
    if (soon) return <ComingSoonCity name={soon} />;
    notFound();
  }
  return (
    <SearchResults
      city={city}
      raw={raw}
      heading={`PGs in ${record.name}`}
    />
  );
}

function ComingSoonCity({ name }: { name: string }) {
  return (
    <div className="container-pg py-16">
      <div className="mx-auto max-w-lg rounded-[24px] bg-primary-soft px-6 py-10 text-center">
        <h1 className="text-2xl font-bold text-ink">PGs in {name} are coming soon</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re onboarding owners in {name}. All live PGs are in Gurgaon right now.
        </p>
        <Button asChild className="mt-5">
          <Link href="/pgs/gurgaon">Browse PGs in Gurgaon</Link>
        </Button>
      </div>
    </div>
  );
}
