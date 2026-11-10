import { describe, expect, it } from "vitest";
import {
  dailyCost,
  monthlyCommute,
  oneWayCost,
  trueMonthlyCost,
} from "@/lib/commute/fares";
import { DEFAULT_FARE_RULES } from "@/lib/commute/fare-rules";

describe("oneWayCost", () => {
  it("walks and cycles for free", () => {
    expect(
      oneWayCost({ mode: "walk", km: 3, minutes: 36, slot: "peak", rules: DEFAULT_FARE_RULES }).cost,
    ).toBe(0);
    expect(
      oneWayCost({ mode: "cycle", km: 5, minutes: 20, slot: "peak", rules: DEFAULT_FARE_RULES }).cost,
    ).toBe(0);
  });

  it("uses DMRC distance slabs from Aug 2025", () => {
    const fare = (km: number) =>
      oneWayCost({ mode: "metro", km, minutes: 20, slot: "peak", rules: DEFAULT_FARE_RULES });

    expect(fare(1.5).cost).toBe(11);
    expect(fare(4).cost).toBe(21);
    expect(fare(8).cost).toBe(32);
    expect(fare(15).cost).toBe(43);
    expect(fare(25).cost).toBe(54);
    expect(fare(40).cost).toBe(64);
    expect(fare(8).sourceUrl).toContain("economictimes");
    expect(fare(8).estimate).toBe(false);
  });

  it("applies an extra 10% off-peak discount on metro after the smart-card 10%", () => {
    const peak = oneWayCost({
      mode: "metro",
      km: 8,
      minutes: 20,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
    });
    const off = oneWayCost({
      mode: "metro",
      km: 8,
      minutes: 20,
      slot: "offpeak",
      rules: DEFAULT_FARE_RULES,
    });
    expect(peak.cost).toBe(32);
    expect(off.cost).toBe(Math.round(32 * 0.9));
  });

  it("charges Rapid Metro ₹20 for typical pairs and ₹35 end to end", () => {
    const short = oneWayCost({
      mode: "rapid_metro",
      km: 3,
      minutes: 10,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
    });
    const long = oneWayCost({
      mode: "rapid_metro",
      km: 10,
      minutes: 25,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
    });
    expect(short.cost).toBe(20);
    expect(long.cost).toBe(35);
  });

  it("uses GMCBL bus slabs", () => {
    const fare = (km: number) =>
      oneWayCost({ mode: "bus", km, minutes: 30, slot: "peak", rules: DEFAULT_FARE_RULES }).cost;
    expect(fare(4)).toBe(10);
    expect(fare(9)).toBe(20);
    expect(fare(16)).toBe(30);
  });

  it("labels auto fares as estimates using base + per_km", () => {
    const result = oneWayCost({
      mode: "auto",
      km: 5,
      minutes: 18,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
    });
    expect(result.cost).toBe(30 + Math.round(11 * 5));
    expect(result.estimate).toBe(true);
  });

  it("applies peak multiplier to Rapido and cab", () => {
    const rapidoOff = oneWayCost({
      mode: "rapido",
      km: 5,
      minutes: 15,
      slot: "offpeak",
      rules: DEFAULT_FARE_RULES,
    });
    const rapidoPeak = oneWayCost({
      mode: "rapido",
      km: 5,
      minutes: 15,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
    });
    expect(rapidoPeak.cost).toBe(Math.round(rapidoOff.cost * 1.2));
  });

  it("computes own-vehicle cost from mileage and fuel price", () => {
    const result = oneWayCost({
      mode: "own_vehicle",
      km: 15,
      minutes: 40,
      slot: "peak",
      rules: DEFAULT_FARE_RULES,
      user: { mileageKmPerL: 15, fuelPrice: 100, parking: 20 },
    });
    expect(result.cost).toBe(120);
  });
});

describe("true monthly cost", () => {
  it("doubles the one-way fare for a daily round trip", () => {
    expect(dailyCost(32)).toBe(64);
  });

  it("uses 22 commute days by default", () => {
    expect(monthlyCommute(64)).toBe(1408);
    expect(monthlyCommute(64, 24)).toBe(1536);
  });

  it("adds rent, optional food add-on and monthly commute", () => {
    expect(trueMonthlyCost(12000, 1408, 0)).toBe(13408);
    expect(trueMonthlyCost(12000, 1408, 2000)).toBe(15408);
  });
});
