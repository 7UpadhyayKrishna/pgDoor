import { describe, expect, it } from "vitest";
import { livabilityScore, safetyScore, walkDecay } from "@/lib/commute/livability";

describe("walkDecay", () => {
  it("is full at 5 minutes and zero at 20", () => {
    expect(walkDecay(3)).toBe(1);
    expect(walkDecay(5)).toBe(1);
    expect(walkDecay(20)).toBe(0);
    expect(walkDecay(12.5)).toBe(0.5);
  });
});

describe("livabilityScore", () => {
  it("returns 0–100 with a category breakdown", () => {
    const result = livabilityScore({
      food: { minutes: 4 },
      grocery: { minutes: 6 },
      metro: { minutes: 8 },
      hospital: { minutes: 12 },
      gym: { minutes: 9 },
      laundry: { minutes: 7 },
      cafe: { minutes: 5 },
      atm: { minutes: 4 },
      park: { minutes: 15 },
    });
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.food).toBeGreaterThan(0);
  });
});

describe("safetyScore", () => {
  it("is labelled indicative and stays in 0–100", () => {
    const result = safetyScore({
      lightingDensity: 0.6,
      nightActivity: 0.4,
      policeMinutes: 12,
      womenReviewAvg: 4.1,
      lastMileWalkMinutes: 8,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.indicative).toBe(true);
  });
});
