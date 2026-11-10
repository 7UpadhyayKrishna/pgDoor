import type { Metadata } from "next";
import { SearchResults } from "@/components/search/results";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const destLabel = typeof raw.destLabel === "string" ? raw.destLabel.trim() : "";
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const filtered = Object.keys(raw).some((key) => key !== "page");
  const title = destLabel ? `PGs near ${destLabel}` : q ? `PGs matching “${q}”` : "Explore PGs in Gurgaon and NCR";
  const description =
    "Search PGs by commute time, rent and true monthly cost. Boys, girls and co-living PGs with photos, deposits and house rules.";
  return {
    title,
    description,
    alternates: { canonical: "/pgs" },
    openGraph: { title, description, url: "/pgs" },
    // Filtered and paged views are duplicates of /pgs for search engines.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

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
      ? `Results for “${q}”`
      : "Explore PGs in NCR";
  return <SearchResults raw={raw} heading={heading} />;
}
