import type { CheckStatus, VerificationCheckType, VerificationLevel } from "@prisma/client";

export const CHECK_TYPES: VerificationCheckType[] = [
  "PROPERTY",
  "OWNER",
  "PHOTOS",
  "ADDRESS",
  "AMENITIES",
  "PRICING",
  "AVAILABILITY",
];

/** Must be genuinely PASSED (not N/A) for PROPERTY_VERIFIED and above. */
export const CORE_CHECKS: VerificationCheckType[] = ["PROPERTY", "OWNER", "PHOTOS", "ADDRESS"];

export const CHECK_LABEL: Record<VerificationCheckType, { title: string; hint: string }> = {
  PROPERTY: { title: "Property exists", hint: "PG is real and operating at this location" },
  OWNER: { title: "Owner identity", hint: "Owner ID / ownership or rent agreement checked" },
  PHOTOS: { title: "Photos are genuine", hint: "Photos match the property in person" },
  ADDRESS: { title: "Address & map pin", hint: "Address and map location are accurate" },
  AMENITIES: { title: "Amenities", hint: "Listed amenities are actually available" },
  PRICING: { title: "Pricing", hint: "Rent, deposit and extra charges match the listing" },
  AVAILABILITY: { title: "Availability", hint: "Bed availability confirmed with the owner" },
};

export type CheckLike = { type: VerificationCheckType; status: CheckStatus };

export function deriveLevel(checks: CheckLike[]): VerificationLevel {
  const status = new Map(checks.map((c) => [c.type, c.status]));
  const passed = (type: VerificationCheckType) => status.get(type) === "PASSED";
  const settled = (type: VerificationCheckType) =>
    status.get(type) === "PASSED" || status.get(type) === "NOT_APPLICABLE";

  if (CORE_CHECKS.every(passed)) {
    return CHECK_TYPES.every(settled) ? "PGDOOR_VERIFIED" : "PROPERTY_VERIFIED";
  }
  return passed("OWNER") ? "OWNER_VERIFIED" : "UNVERIFIED";
}

/** Number of checks that are done (passed or not applicable) out of all checks. */
export function checkProgress(checks: CheckLike[]) {
  const done = checks.filter((c) => c.status === "PASSED" || c.status === "NOT_APPLICABLE").length;
  const failed = checks.filter((c) => c.status === "FAILED").length;
  return { done, failed, total: CHECK_TYPES.length };
}
