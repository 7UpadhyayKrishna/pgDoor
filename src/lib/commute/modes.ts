export const COMMUTE_MODES = [
  "walk",
  "cycle",
  "metro",
  "rapid_metro",
  "bus",
  "auto",
  "shared_auto",
  "rapido",
  "cab",
  "own_vehicle",
] as const;

export type CommuteMode = (typeof COMMUTE_MODES)[number];
export type CommuteSlot = "peak" | "offpeak";
export type GoogleTravelMode = "DRIVE" | "TRANSIT" | "WALK" | "TWO_WHEELER" | "BICYCLE";
export type LegacyTravelMode = "driving" | "transit" | "walking" | "bicycling";

export const MVP_MODES: CommuteMode[] = ["walk", "metro", "bus", "auto"];
export const ALL_DETAIL_MODES: CommuteMode[] = [
  "walk",
  "cycle",
  "metro",
  "rapid_metro",
  "bus",
  "auto",
  "rapido",
  "cab",
  "own_vehicle",
];

export const MODE_LABEL: Record<CommuteMode, string> = {
  walk: "Walk",
  cycle: "Cycle",
  metro: "Delhi Metro",
  rapid_metro: "Rapid Metro",
  bus: "City bus",
  auto: "Auto",
  shared_auto: "Shared auto",
  rapido: "Rapido",
  cab: "Cab",
  own_vehicle: "Own vehicle",
};

export const LEGACY_TO_COMMUTE: Record<LegacyTravelMode, CommuteMode> = {
  driving: "auto",
  transit: "metro",
  walking: "walk",
  bicycling: "cycle",
};

export const COMMUTE_TO_LEGACY: Record<CommuteMode, LegacyTravelMode> = {
  walk: "walking",
  cycle: "bicycling",
  metro: "transit",
  rapid_metro: "transit",
  bus: "transit",
  auto: "driving",
  shared_auto: "driving",
  rapido: "bicycling",
  cab: "driving",
  own_vehicle: "driving",
};

const COMMUTE_SET = new Set<string>(COMMUTE_MODES);
const LEGACY_SET = new Set<string>(["driving", "transit", "walking", "bicycling"]);

export function parseCommuteMode(raw?: string | null): CommuteMode {
  if (!raw) return "metro";
  if (COMMUTE_SET.has(raw)) return raw as CommuteMode;
  if (LEGACY_SET.has(raw)) return LEGACY_TO_COMMUTE[raw as LegacyTravelMode];
  return "metro";
}

export function googleTravelMode(mode: CommuteMode): GoogleTravelMode {
  switch (mode) {
    case "walk":
      return "WALK";
    case "cycle":
      return "BICYCLE";
    case "metro":
    case "rapid_metro":
    case "bus":
      return "TRANSIT";
    case "rapido":
      return "TWO_WHEELER";
    default:
      return "DRIVE";
  }
}

export function isTrafficAware(mode: CommuteMode): boolean {
  return googleTravelMode(mode) === "DRIVE" || googleTravelMode(mode) === "TWO_WHEELER";
}
