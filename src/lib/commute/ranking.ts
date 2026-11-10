export function invertNorm(value: number, min: number, max: number) {
  if (max <= min) return 1;
  const t = (value - min) / (max - min);
  return 1 - Math.min(1, Math.max(0, t));
}

export function commuteRankScore({
  commuteTimeNorm,
  trueCostNorm,
  preferenceMatch,
  livability,
  trust,
  freshness,
}: {
  commuteTimeNorm: number;
  trueCostNorm: number;
  preferenceMatch: number;
  livability: number;
  trust: number;
  freshness: number;
}) {
  return (
    0.35 * commuteTimeNorm +
    0.25 * trueCostNorm +
    0.15 * preferenceMatch +
    0.1 * livability +
    0.1 * trust +
    0.05 * freshness
  );
}

export type RankedLeg = {
  minutes: number;
  tripsPerWeek: number;
  weight?: number;
};

export function multiDestinationTime(legs: RankedLeg[], style: "weighted" | "fair") {
  if (legs.length === 0) return Number.POSITIVE_INFINITY;
  if (style === "fair") {
    return Math.max(...legs.map((leg) => leg.minutes));
  }
  return legs.reduce((sum, leg) => {
    const weight = leg.weight ?? 1;
    return sum + leg.minutes * leg.tripsPerWeek * weight;
  }, 0);
}
