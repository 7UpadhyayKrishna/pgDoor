import { describe, expect, it } from "vitest";
import {
  commuteRankScore,
  invertNorm,
  multiDestinationTime,
} from "@/lib/commute/ranking";

describe("invertNorm", () => {
  it("scores lower commute times higher", () => {
    expect(invertNorm(10, 10, 50)).toBe(1);
    expect(invertNorm(50, 10, 50)).toBe(0);
    expect(invertNorm(30, 10, 50)).toBe(0.5);
  });
});

describe("commuteRankScore", () => {
  it("weights commute time and true cost most heavily", () => {
    const better = commuteRankScore({
      commuteTimeNorm: 1,
      trueCostNorm: 1,
      preferenceMatch: 0,
      livability: 0,
      trust: 0,
      freshness: 0,
    });
    const worse = commuteRankScore({
      commuteTimeNorm: 0,
      trueCostNorm: 0,
      preferenceMatch: 1,
      livability: 1,
      trust: 1,
      freshness: 1,
    });
    expect(better).toBeCloseTo(0.6);
    expect(worse).toBeCloseTo(0.4);
    expect(better).toBeGreaterThan(worse);
  });
});

describe("multiDestinationTime", () => {
  it("sums trips-per-week times for weighted ranking", () => {
    expect(
      multiDestinationTime(
        [
          { minutes: 20, tripsPerWeek: 5, weight: 1 },
          { minutes: 40, tripsPerWeek: 2, weight: 1 },
        ],
        "weighted",
      ),
    ).toBe(20 * 5 + 40 * 2);
  });

  it("uses the worse commute for fair ranking and the sum to break ties", () => {
    expect(
      multiDestinationTime(
        [
          { minutes: 15, tripsPerWeek: 5, weight: 1 },
          { minutes: 45, tripsPerWeek: 5, weight: 1 },
        ],
        "fair",
      ),
    ).toBe(45);
  });
});
