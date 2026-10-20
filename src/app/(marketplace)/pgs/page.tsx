import { SearchResults } from "@/components/search/results";

export const dynamic = "force-dynamic";

export default async function PgsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const destLabel = typeof raw.destLabel === "string" ? raw.destLabel.trim() : "";
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const heading = destLabel
    ? `PGs near ${destLabel}`
    : q
      ? `PGs near “${q}”`
      : "Explore PGs in NCR";
  return <SearchResults raw={raw} heading={heading} />;
}
