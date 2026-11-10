import { DEFAULT_FARE_RULES, type FareRuleInput } from "@/lib/commute/fare-rules";
import type { CommuteMode, CommuteSlot } from "@/lib/commute/modes";

export type VehicleOverrides = {
  mileageKmPerL?: number;
  fuelPrice?: number;
  parking?: number;
  bikeRental?: number;
};

export type FareResult = {
  cost: number;
  sourceUrl: string;
  estimate: boolean;
  effectiveFrom: string;
};

function pickRule(mode: CommuteMode, rules: FareRuleInput[], city = "gurugram") {
  return (
    rules.find((rule) => rule.mode === mode && rule.city === city) ??
    rules.find((rule) => rule.mode === mode)
  );
}

function slabFare(slabs: { maxKm: number; fare: number }[], km: number) {
  const match = slabs.find((slab) => km <= slab.maxKm);
  return match?.fare ?? slabs[slabs.length - 1]?.fare ?? 0;
}

export function oneWayCost({
  mode,
  km,
  minutes,
  slot,
  rules = DEFAULT_FARE_RULES,
  city = "gurugram",
  user,
}: {
  mode: CommuteMode;
  km: number;
  minutes: number;
  slot: CommuteSlot;
  rules?: FareRuleInput[];
  city?: string;
  user?: VehicleOverrides;
}): FareResult {
  if (mode === "walk") {
    return { cost: 0, sourceUrl: "none", estimate: false, effectiveFrom: "2026-01-01" };
  }
  if (mode === "cycle") {
    const rental = user?.bikeRental ?? 0;
    return {
      cost: Math.round(rental),
      sourceUrl: "none",
      estimate: rental > 0,
      effectiveFrom: "2026-01-01",
    };
  }

  const rule = pickRule(mode, rules, city);
  if (!rule) {
    return { cost: 0, sourceUrl: "none", estimate: true, effectiveFrom: "2026-01-01" };
  }

  let cost = 0;
  if (mode === "own_vehicle") {
    const mileage = user?.mileageKmPerL ?? 15;
    const fuel = user?.fuelPrice ?? 100;
    const parking = user?.parking ?? 20;
    cost = (km / mileage) * fuel + parking;
  } else if (rule.slabs?.length) {
    cost = slabFare(rule.slabs, km);
  } else if (mode === "rapid_metro") {
    const endKm = rule.endToEndKm ?? 7;
    cost = km >= endKm ? (rule.endToEndFare ?? 35) : (rule.base ?? 20);
  } else {
    cost = (rule.base ?? 0) + (rule.perKm ?? 0) * km + (rule.perMin ?? 0) * minutes;
    if (slot === "peak" && rule.peakMultiplier && rule.peakMultiplier !== 1) {
      cost *= rule.peakMultiplier;
    }
  }

  if (mode === "metro" && slot === "offpeak") {
    cost *= 0.9;
  }

  return {
    cost: Math.round(cost),
    sourceUrl: rule.sourceUrl,
    estimate: Boolean(rule.estimate),
    effectiveFrom: rule.effectiveFrom,
  };
}

export function dailyCost(oneWay: number, returnOneWay = oneWay) {
  return oneWay + returnOneWay;
}

export function monthlyCommute(daily: number, days = 22) {
  return daily * days;
}

export function trueMonthlyCost(rent: number, monthlyFare: number, foodAddon = 0) {
  return rent + monthlyFare + foodAddon;
}
