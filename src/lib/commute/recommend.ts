import type { CommuteMode } from "@/lib/commute/modes";

export type ModeOption = {
  mode: CommuteMode;
  minutes: number;
  monthlyCost: number;
};

export function recommendedMode(
  options: ModeOption[],
  {
    maxMinutes,
    valueOfTimePerHour = 0,
  }: { maxMinutes?: number; valueOfTimePerHour?: number } = {},
): ModeOption | null {
  const eligible = options.filter(
    (option) => maxMinutes == null || option.minutes <= maxMinutes,
  );
  if (eligible.length === 0) return null;

  let best = eligible[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const option of eligible) {
    const hours = (option.minutes / 60) * 2 * 22;
    const score = option.monthlyCost + valueOfTimePerHour * hours;
    if (score < bestScore) {
      best = option;
      bestScore = score;
    }
  }
  return best;
}
