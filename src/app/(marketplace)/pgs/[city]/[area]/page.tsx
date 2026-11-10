import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchResults } from "@/components/search/results";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { getAreaBySlugs } from "@/modules/locations";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; area: string }>;
}): Promise<Metadata> {
  const { city, area } = await params;
  const record = await getAreaBySlugs(city, area);
  if (!record) return {};
  const stats = await prisma.property.aggregate({
    where: { areaId: record.id, status: "PUBLISHED" },
    _count: true,
    _min: { minRent: true },
  });
  const place = `${record.name}, ${record.city.name}`;
  const title = stats._count
    ? `${stats._count} PGs in ${place}${stats._min.minRent ? ` from ${formatInr(stats._min.minRent)}` : ""}`
    : `PGs in ${place}`;
  const description = `PGs in ${place} with rent, deposits, food, house rules and commute times. Compare boys, girls and co-living PGs on pgDoor.`;
  const url = `/pgs/${record.city.slug}/${record.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    robots: stats._count ? undefined : { index: false },
  };
}

export default async function AreaPgsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string; area: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { city, area } = await params;
  const raw = await searchParams;
  const record = await getAreaBySlugs(city, area);
  if (!record) notFound();
  return (
    <SearchResults
      city={city}
      area={area}
      raw={raw}
      heading={`PGs in ${record.name}, ${record.city.name}`}
    />
  );
}
