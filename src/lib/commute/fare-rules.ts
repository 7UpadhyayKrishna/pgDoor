import type { CommuteMode } from "@/lib/commute/modes";

export type FareSlab = { maxKm: number; fare: number };

export type FareRuleInput = {
  mode: CommuteMode;
  city: string;
  effectiveFrom: string;
  slabs?: FareSlab[];
  base?: number;
  perKm?: number;
  perMin?: number;
  peakMultiplier?: number;
  endToEndKm?: number;
  endToEndFare?: number;
  sourceUrl: string;
  estimate?: boolean;
};

export const DEFAULT_FARE_RULES: FareRuleInput[] = [
  {
    mode: "metro",
    city: "gurugram",
    effectiveFrom: "2025-08-25",
    slabs: [
      { maxKm: 2, fare: 11 },
      { maxKm: 5, fare: 21 },
      { maxKm: 12, fare: 32 },
      { maxKm: 21, fare: 43 },
      { maxKm: 32, fare: 54 },
      { maxKm: Infinity, fare: 64 },
    ],
    sourceUrl:
      "https://m.economictimes.com/news/india/delhi-metro-fare-hike-2025-dmrc-increase-ticket-price-check-all-new-prices-list/amp_articleshow/123492210.cms",
  },
  {
    mode: "rapid_metro",
    city: "gurugram",
    effectiveFrom: "2024-01-01",
    base: 20,
    endToEndKm: 7,
    endToEndFare: 35,
    sourceUrl: "https://www.metro2go.in/en/gurugram/rapid-metro/fares",
  },
  {
    mode: "bus",
    city: "gurugram",
    effectiveFrom: "2025-09-01",
    slabs: [
      { maxKm: 6, fare: 10 },
      { maxKm: 13, fare: 20 },
      { maxKm: Infinity, fare: 30 },
    ],
    sourceUrl:
      "https://timesofindia.indiatimes.com/city/gurgaon/gmcbls-fare-overhaul-in-gurgaon-travel-up-to-6km-for-rs-10-beyond-13km-for-s-30/articleshow/124132083.cms",
  },
  {
    mode: "auto",
    city: "gurugram",
    effectiveFrom: "2026-01-01",
    base: 30,
    perKm: 11,
    sourceUrl: "https://pgdoor.in/fares/auto-estimate",
    estimate: true,
  },
  {
    mode: "shared_auto",
    city: "gurugram",
    effectiveFrom: "2026-01-01",
    slabs: [
      { maxKm: 5, fare: 20 },
      { maxKm: 10, fare: 30 },
      { maxKm: Infinity, fare: 40 },
    ],
    sourceUrl: "https://pgdoor.in/fares/shared-auto-estimate",
    estimate: true,
  },
  {
    mode: "rapido",
    city: "gurugram",
    effectiveFrom: "2026-01-01",
    base: 25,
    perKm: 8,
    perMin: 1,
    peakMultiplier: 1.2,
    sourceUrl: "https://pgdoor.in/fares/rapido-estimate",
    estimate: true,
  },
  {
    mode: "cab",
    city: "gurugram",
    effectiveFrom: "2026-01-01",
    base: 50,
    perKm: 12,
    perMin: 1.5,
    peakMultiplier: 1.2,
    sourceUrl: "https://pgdoor.in/fares/cab-estimate",
    estimate: true,
  },
  {
    mode: "own_vehicle",
    city: "gurugram",
    effectiveFrom: "2026-01-01",
    sourceUrl: "https://pgdoor.in/fares/own-vehicle",
    estimate: true,
  },
];
