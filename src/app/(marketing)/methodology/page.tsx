export const metadata = {
  title: "How pgDoor scores commute, livability and safety",
};

export default function MethodologyPage() {
  return (
    <div className="container-pg max-w-2xl py-12">
      <h1 className="text-3xl font-bold">How we calculate commute, livability and safety</h1>
      <p className="mt-4 text-sm leading-6 text-ink/80">
        Times come from Google Routes (peak driving is traffic-aware). Fares come from versioned
        tables: DMRC slabs (Aug 2025), Rapid Metro, GMCBL, and labelled estimates for auto, Rapido
        and cabs. True monthly cost is rent plus commute days (default 22) times the daily round-trip
        fare of the recommended mode.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Livability</h2>
      <p className="mt-2 text-sm leading-6 text-ink/80">
        A 0–100 score from nearby food, grocery, metro, hospital, gym, laundry, cafe, ATM and park.
        Each category decays from full score at a 5-minute walk to zero at 20 minutes.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Women&apos;s safety</h2>
      <p className="mt-2 text-sm leading-6 text-ink/80">
        This score is <strong>indicative, not a guarantee</strong> and is not an official rating. It
        combines street lighting, late-night activity, distance to a police station, verified
        women-tenant reviews, and last-mile walking time. It never names a place as unsafe.
      </p>
    </div>
  );
}
