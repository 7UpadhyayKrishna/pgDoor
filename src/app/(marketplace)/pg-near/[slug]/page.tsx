import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchResults } from "@/components/search/results";
import { getDestinationBySlug } from "@/modules/destinations";
import { MODE_LABEL, MVP_MODES } from "@/lib/commute/modes";
import { oneWayCost, dailyCost, monthlyCommute } from "@/lib/commute/fares";
import { DEFAULT_FARE_RULES } from "@/lib/commute/fare-rules";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);
  if (!dest) return { title: "PGs nearby" };
  return {
    title: `PGs near ${dest.name} | pgDoor`,
    description: `Find PGs near ${dest.name} ranked by commute time and true monthly cost (rent + fare).`,
  };
}

export default async function PgNearPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const dest = await getDestinationBySlug(slug);
  if (!dest) notFound();

  const typicalKm = 8;
  const fareRows = MVP_MODES.map((mode) => {
    const fare = oneWayCost({
      mode,
      km: typicalKm,
      minutes: 25,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
    });
    return {
      mode,
      daily: dailyCost(fare.cost),
      monthly: monthlyCommute(dailyCost(fare.cost)),
      source: fare.sourceUrl,
    };
  });

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How long is the commute from nearby PGs to ${dest.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `pgDoor ranks PGs by peak-hour commute time and true monthly cost to ${dest.name}.`,
        },
      },
      {
        "@type": "Question",
        name: "What is true monthly cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rent plus the monthly commute fare of the recommended mode, using 22 commute days by default.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <div className="container-pg pt-6">
        <h1 className="text-2xl font-bold">PGs near {dest.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ranked by commute and true monthly cost. Typical one-way distance used for the fare table
          below is {typicalKm} km.
        </p>
        <div className="mt-4 overflow-x-auto rounded-[18px] bg-white p-4 shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Mode</th>
                <th>Daily</th>
                <th>Monthly (22 days)</th>
              </tr>
            </thead>
            <tbody>
              {fareRows.map((row) => (
                <tr key={row.mode}>
                  <td className="py-1">{MODE_LABEL[row.mode]}</td>
                  <td>₹{row.daily}</td>
                  <td>₹{row.monthly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SearchResults
        raw={{
          ...raw,
          destLat: String(dest.latitude),
          destLng: String(dest.longitude),
          destLabel: dest.name,
          sort: typeof raw.sort === "string" ? raw.sort : "true_cost",
        }}
        heading={`PGs near ${dest.name}`}
      />
    </>
  );
}
