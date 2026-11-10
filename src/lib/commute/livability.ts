export function walkDecay(minutes: number) {
  if (minutes <= 5) return 1;
  if (minutes >= 20) return 0;
  return (20 - minutes) / 15;
}

type CategoryInput = { minutes: number | null };

const LIVABILITY_WEIGHTS = {
  food: 15,
  grocery: 15,
  metro: 20,
  hospital: 15,
  gym: 5,
  laundry: 5,
  cafe: 5,
  atm: 5,
  park: 15,
} as const;

export type LivabilityCategory = keyof typeof LIVABILITY_WEIGHTS;

export function livabilityScore(input: Partial<Record<LivabilityCategory, CategoryInput>>) {
  let weighted = 0;
  let total = 0;
  const breakdown: Record<string, number> = {};
  for (const [key, weight] of Object.entries(LIVABILITY_WEIGHTS) as [
    LivabilityCategory,
    number,
  ][]) {
    const minutes = input[key]?.minutes;
    const value = minutes == null ? 0 : walkDecay(minutes);
    breakdown[key] = Math.round(value * 100);
    weighted += value * weight;
    total += weight;
  }
  return {
    score: Math.round((weighted / total) * 100),
    breakdown,
  };
}

export function safetyScore({
  lightingDensity,
  nightActivity,
  policeMinutes,
  womenReviewAvg,
  lastMileWalkMinutes,
}: {
  lightingDensity: number;
  nightActivity: number;
  policeMinutes: number;
  womenReviewAvg: number | null;
  lastMileWalkMinutes: number;
}) {
  const police = walkDecay(policeMinutes);
  const lastMile = walkDecay(lastMileWalkMinutes);
  const reviews = womenReviewAvg == null ? 0.5 : Math.min(1, Math.max(0, womenReviewAvg / 5));
  const raw =
    0.2 * lightingDensity +
    0.15 * nightActivity +
    0.2 * police +
    0.3 * reviews +
    0.15 * lastMile;
  return {
    score: Math.round(Math.min(1, Math.max(0, raw)) * 100),
    indicative: true as const,
    breakdown: {
      lighting: Math.round(lightingDensity * 100),
      nightActivity: Math.round(nightActivity * 100),
      police: Math.round(police * 100),
      reviews: Math.round(reviews * 100),
      lastMile: Math.round(lastMile * 100),
    },
  };
}
