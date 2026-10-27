import type { PgType, RoomSharingType } from "@prisma/client";
import { SHARING_LABEL } from "@/lib/constants";
import { formatDistanceKm } from "@/lib/directions";
import { formatInr } from "@/lib/format";

/** PG details returned by /api/compare. Dates are ISO strings. */
export type ComparePg = {
  id: string;
  slug: string;
  name: string;
  pgType: PgType;
  address: string;
  areaName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  photo: string | null;
  minRent: number;
  minDeposit: number;
  maintenanceCharge: number | null;
  electricityNote: string | null;
  availableBeds: number;
  totalBeds: number;
  roomTypes: {
    sharingType: RoomSharingType;
    rent: number;
    deposit: number;
    availableBeds: number;
    totalBeds: number;
  }[];
  foodIncluded: boolean;
  vegetarianFood: boolean;
  nonVegetarianFood: boolean;
  mealsProvided: string[];
  amenities: { slug: string; name: string }[];
  smokingAllowed: boolean;
  visitorsAllowed: boolean;
  cookingAllowed: boolean;
  alcoholAllowed: boolean;
  gateClosingTime: string | null;
  noticePeriodDays: number | null;
  lockInMonths: number | null;
  ratingAvg: number;
  reviewCount: number;
  verificationLevel: string;
  moveInFrom: string | null;
  availabilityConfirmedAt: string;
  commute: { distanceKm: number; minutes: number | null; mode: string; fromRoute: boolean } | null;
};

export type HouseRuleNeed = "visitors" | "cooking" | "smoking" | "alcohol";

export type Requirements = {
  budgetMax?: number;
  sharing?: RoomSharingType;
  pgType?: PgType;
  food?: boolean;
  vegOnly?: boolean;
  amenities: string[];
  commuteMax?: number;
  /** yyyy-mm-dd */
  moveInBy?: string;
  needs: HouseRuleNeed[];
};

export const EMPTY_REQUIREMENTS: Requirements = { amenities: [], needs: [] };

export type MatchStatus = "match" | "partial" | "miss";

export type MatchKey =
  | "budget"
  | "commute"
  | "pgType"
  | "sharing"
  | "food"
  | "amenities"
  | "moveIn"
  | "rules";

export type MatchItem = {
  key: MatchKey;
  label: string;
  weight: number;
  earned: number;
  status: MatchStatus;
  detail: string;
  dealbreaker?: boolean;
};

export type MatchResult = {
  /** 0–100, or null when no requirements are set. */
  score: number | null;
  items: MatchItem[];
  dealbreaker: boolean;
};

export const MATCH_WEIGHTS: Record<MatchKey, number> = {
  budget: 25,
  commute: 20,
  pgType: 15,
  sharing: 10,
  food: 10,
  amenities: 10,
  moveIn: 5,
  rules: 5,
};

/** A dealbreaker (e.g. a boys-only PG for someone who needs a girls PG) caps the score here. */
export const DEALBREAKER_CAP = 40;

const RULE_LABEL: Record<HouseRuleNeed, string> = {
  visitors: "Visitors",
  cooking: "Cooking",
  smoking: "Smoking",
  alcohol: "Alcohol",
};

const PG_TYPE_TEXT: Record<PgType, string> = {
  BOYS: "Boys only",
  GIRLS: "Girls only",
  CO_LIVING: "Co-living",
  UNISEX: "Unisex",
};

function item(
  key: MatchKey,
  label: string,
  fraction: number,
  detail: string,
  dealbreaker = false,
): MatchItem {
  const weight = MATCH_WEIGHTS[key];
  const status: MatchStatus = fraction >= 1 ? "match" : fraction > 0 ? "partial" : "miss";
  return { key, label, weight, earned: weight * fraction, status, detail, dealbreaker };
}

function rentFor(pg: ComparePg, sharing?: RoomSharingType) {
  const room = sharing ? pg.roomTypes.find((rt) => rt.sharingType === sharing) : null;
  return room?.rent ?? pg.minRent;
}

/** Commute minutes from the route, or a rough estimate (~20 km/h door to door) from distance. */
export function commuteMinutes(pg: ComparePg) {
  if (!pg.commute) return null;
  if (pg.commute.minutes != null) return { minutes: pg.commute.minutes, estimated: false };
  return { minutes: Math.round(pg.commute.distanceKm * 3), estimated: true };
}

export function scoreMatch(pg: ComparePg, req: Requirements): MatchResult {
  const items: MatchItem[] = [];

  if (req.budgetMax) {
    const rent = rentFor(pg, req.sharing);
    const fraction = rent <= req.budgetMax ? 1 : rent <= req.budgetMax * 1.1 ? 0.5 : 0;
    items.push(
      item("budget", "Budget", fraction, `${formatInr(rent)}/mo vs budget ${formatInr(req.budgetMax)}`),
    );
  }

  if (req.commuteMax) {
    const commute = commuteMinutes(pg);
    if (commute && pg.commute) {
      const { minutes, estimated } = commute;
      const fraction = minutes <= req.commuteMax ? 1 : minutes <= req.commuteMax + 10 ? 0.5 : 0;
      items.push(
        item(
          "commute",
          "Commute",
          fraction,
          `${estimated ? "About " : ""}${minutes} min (${formatDistanceKm(pg.commute.distanceKm)}) vs max ${req.commuteMax} min`,
        ),
      );
    }
  }

  if (req.pgType) {
    const want = req.pgType;
    const mixed = (t: PgType) => t === "UNISEX" || t === "CO_LIVING";
    let fraction = 0;
    let dealbreaker = false;
    if (pg.pgType === want || (mixed(want) && mixed(pg.pgType))) fraction = 1;
    else if (!mixed(want) && mixed(pg.pgType)) fraction = 0.5;
    else if ((want === "GIRLS" && pg.pgType === "BOYS") || (want === "BOYS" && pg.pgType === "GIRLS")) {
      dealbreaker = true;
    }
    items.push(
      item("pgType", "PG type", fraction, `${PG_TYPE_TEXT[pg.pgType]} vs wanted ${PG_TYPE_TEXT[want]}`, dealbreaker),
    );
  }

  if (req.sharing) {
    const room = pg.roomTypes.find((rt) => rt.sharingType === req.sharing);
    const label = SHARING_LABEL[req.sharing];
    const fraction = !room ? 0 : room.availableBeds > 0 ? 1 : 0.5;
    const detail = !room
      ? `No ${label.toLowerCase()}`
      : room.availableBeds > 0
        ? `${label}: ${room.availableBeds} beds free`
        : `${label} offered but full right now`;
    items.push(item("sharing", "Sharing", fraction, detail));
  }

  if (req.food || req.vegOnly) {
    let fraction = 0;
    let detail = "Food not included";
    if (pg.foodIncluded) {
      if (!req.vegOnly || pg.vegetarianFood) {
        fraction = 1;
        detail = pg.vegetarianFood && !pg.nonVegetarianFood ? "Veg food included" : "Food included";
      } else {
        fraction = 0.5;
        detail = "Food included, but no veg option listed";
      }
    }
    items.push(item("food", req.vegOnly ? "Veg food" : "Food", fraction, detail));
  }

  if (req.amenities.length) {
    const have = new Set(pg.amenities.map((a) => a.slug));
    const missing = req.amenities.filter((slug) => !have.has(slug));
    const fraction = (req.amenities.length - missing.length) / req.amenities.length;
    const names = new Map(pg.amenities.map((a) => [a.slug, a.name]));
    items.push(
      item(
        "amenities",
        "Amenities",
        fraction,
        missing.length
          ? `Missing ${missing.map((slug) => names.get(slug) ?? slug.replace(/-/g, " ")).join(", ")}`
          : `All ${req.amenities.length} must-haves`,
      ),
    );
  }

  if (req.moveInBy) {
    const by = new Date(`${req.moveInBy}T23:59:59`);
    const from = pg.moveInFrom ? new Date(pg.moveInFrom) : null;
    let fraction = 0;
    let detail: string;
    if (pg.availableBeds <= 0) detail = "No beds free right now";
    else if (from && from > by) detail = `Move-in from ${from.toLocaleDateString("en-IN")}`;
    else {
      fraction = 1;
      detail = from ? `Move-in from ${from.toLocaleDateString("en-IN")}` : "Ready to move in";
    }
    items.push(item("moveIn", "Move-in date", fraction, detail));
  }

  if (req.needs.length) {
    const allowed: Record<HouseRuleNeed, boolean> = {
      visitors: pg.visitorsAllowed,
      cooking: pg.cookingAllowed,
      smoking: pg.smokingAllowed,
      alcohol: pg.alcoholAllowed,
    };
    const blocked = req.needs.filter((need) => !allowed[need]);
    const fraction = (req.needs.length - blocked.length) / req.needs.length;
    items.push(
      item(
        "rules",
        "House rules",
        fraction,
        blocked.length
          ? `${blocked.map((need) => RULE_LABEL[need]).join(", ")} not allowed`
          : "All your needs allowed",
      ),
    );
  }

  const possible = items.reduce((sum, i) => sum + i.weight, 0);
  const earned = items.reduce((sum, i) => sum + i.earned, 0);
  const dealbreaker = items.some((i) => i.dealbreaker);
  let score = possible ? Math.round((earned / possible) * 100) : null;
  if (score != null && dealbreaker) score = Math.min(score, DEALBREAKER_CAP);

  return { score, items, dealbreaker };
}

const SHARING_VALUES: RoomSharingType[] = ["SINGLE", "DOUBLE", "TRIPLE", "FOUR"];
const PG_TYPE_VALUES: PgType[] = ["BOYS", "GIRLS", "CO_LIVING", "UNISEX"];
const NEED_VALUES: HouseRuleNeed[] = ["visitors", "cooking", "smoking", "alcohol"];

/** Requirements implied by search filters; only fields present in the URL are set. */
export function requirementsFromParams(params: URLSearchParams): Partial<Requirements> {
  const out: Partial<Requirements> = {};
  const budget = Number(params.get("budgetMax"));
  if (budget > 0) out.budgetMax = budget;
  const sharing = params.get("sharing") as RoomSharingType | null;
  if (sharing && SHARING_VALUES.includes(sharing)) out.sharing = sharing;
  const pgType = params.get("pgType") as PgType | null;
  if (pgType && PG_TYPE_VALUES.includes(pgType)) out.pgType = pgType;
  if (params.get("food") === "true") out.food = true;
  const amenities = params.getAll("amenities").filter(Boolean);
  if (amenities.length) out.amenities = amenities;
  const commute = Number(params.get("commuteMax"));
  if (commute > 0) out.commuteMax = commute;
  const from = params.get("availableFrom");
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) out.moveInBy = from;
  return out;
}

export function sanitizeRequirements(value: unknown): Requirements {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : undefined);
  return {
    budgetMax: num(raw.budgetMax),
    sharing: SHARING_VALUES.find((s) => s === raw.sharing),
    pgType: PG_TYPE_VALUES.find((t) => t === raw.pgType),
    food: raw.food === true || undefined,
    vegOnly: raw.vegOnly === true || undefined,
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.filter((a): a is string => typeof a === "string")
      : [],
    commuteMax: num(raw.commuteMax),
    moveInBy:
      typeof raw.moveInBy === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.moveInBy)
        ? raw.moveInBy
        : undefined,
    needs: Array.isArray(raw.needs)
      ? raw.needs.filter((n): n is HouseRuleNeed => NEED_VALUES.includes(n as HouseRuleNeed))
      : [],
  };
}
