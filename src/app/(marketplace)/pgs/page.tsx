import { SearchResults } from "@/components/search/results";

export const dynamic = "force-dynamic";

export default async function PgsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const heading = q ? `PGs near “${q}”` : "PGs in NCR";
  return <SearchResults raw={raw} heading={heading} />;
}
