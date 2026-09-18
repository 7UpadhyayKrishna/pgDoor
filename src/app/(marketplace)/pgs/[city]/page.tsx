import { notFound } from "next/navigation";
import { SearchResults } from "@/components/search/results";
import { getCityBySlug } from "@/modules/locations";

export const dynamic = "force-dynamic";

export default async function CityPgsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { city } = await params;
  const raw = await searchParams;
  const record = await getCityBySlug(city);
  if (!record) notFound();
  return (
    <SearchResults
      city={city}
      raw={raw}
      heading={`PGs in ${record.name}`}
    />
  );
}
