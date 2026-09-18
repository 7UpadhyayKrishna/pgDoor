import { notFound } from "next/navigation";
import { SearchResults } from "@/components/search/results";
import { getAreaBySlugs } from "@/modules/locations";

export const dynamic = "force-dynamic";

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
