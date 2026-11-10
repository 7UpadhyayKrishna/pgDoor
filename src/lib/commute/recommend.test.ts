import { describe, expect, it } from "vitest";
import { recommendedMode } from "@/lib/commute/recommend";

const options = [
  { mode: "walk" as const, minutes: 55, monthlyCost: 0 },
  { mode: "metro" as const, minutes: 28, monthlyCost: 1408 },
  { mode: "auto" as const, minutes: 18, monthlyCost: 3740 },
  { mode: "bus" as const, minutes: 40, monthlyCost: 880 },
];

describe("recommendedMode", () => {
  it("picks the cheapest mode under the time limit when value of time is 0", () => {
    const pick = recommendedMode(options, { maxMinutes: 45, valueOfTimePerHour: 0 });
    expect(pick?.mode).toBe("bus");
  });

  it("drops modes over the time limit", () => {
    const pick = recommendedMode(options, { maxMinutes: 30, valueOfTimePerHour: 0 });
    expect(pick?.mode).toBe("metro");
  });

  it("trades money for time when the user sets a value of time", () => {
    const pick = recommendedMode(options, { maxMinutes: 90, valueOfTimePerHour: 500 });
    expect(pick?.mode).toBe("auto");
  });
});
