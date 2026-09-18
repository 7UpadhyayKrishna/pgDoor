import { SearchResults } from "@/components/search/results";

export const dynamic = "force-dynamic";

export default async function PgsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  return <SearchResults raw={raw} heading="PGs in NCR" />;
}
