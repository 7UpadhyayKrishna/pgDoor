import { describe, expect, it } from "vitest";
import type { CheckStatus, VerificationCheckType } from "@prisma/client";
import { CHECK_TYPES, checkProgress, deriveLevel } from "@/modules/verification/levels";

function checks(statuses: Partial<Record<VerificationCheckType, CheckStatus>>) {
  return Object.entries(statuses).map(([type, status]) => ({
    type: type as VerificationCheckType,
    status: status as CheckStatus,
  }));
}

const allPassed = Object.fromEntries(CHECK_TYPES.map((t) => [t, "PASSED"])) as Record<
  VerificationCheckType,
  CheckStatus
>;

describe("deriveLevel", () => {
  it("is unverified with no checks", () => {
    expect(deriveLevel([])).toBe("UNVERIFIED");
  });

  it("is owner verified once the owner check passes", () => {
    expect(deriveLevel(checks({ OWNER: "PASSED", PHOTOS: "PASSED" }))).toBe("OWNER_VERIFIED");
  });

  it("is property verified when the four core checks pass", () => {
    expect(
      deriveLevel(checks({ PROPERTY: "PASSED", OWNER: "PASSED", PHOTOS: "PASSED", ADDRESS: "PASSED" })),
    ).toBe("PROPERTY_VERIFIED");
  });

  it("is pgDoor verified when every check passes", () => {
    expect(deriveLevel(checks(allPassed))).toBe("PGDOOR_VERIFIED");
  });

  it("treats non-core N/A checks as settled", () => {
    expect(deriveLevel(checks({ ...allPassed, AMENITIES: "NOT_APPLICABLE", PRICING: "NOT_APPLICABLE" }))).toBe(
      "PGDOOR_VERIFIED",
    );
  });

  it("does not accept N/A for a core check", () => {
    expect(deriveLevel(checks({ ...allPassed, PHOTOS: "NOT_APPLICABLE" }))).toBe("OWNER_VERIFIED");
  });

  it("drops a level when a non-core check fails", () => {
    expect(deriveLevel(checks({ ...allPassed, PRICING: "FAILED" }))).toBe("PROPERTY_VERIFIED");
  });

  it("is unverified when the owner check fails", () => {
    expect(deriveLevel(checks({ ...allPassed, OWNER: "FAILED" }))).toBe("UNVERIFIED");
  });
});

describe("checkProgress", () => {
  it("counts passed and N/A as done and reports failures", () => {
    expect(
      checkProgress(checks({ OWNER: "PASSED", AMENITIES: "NOT_APPLICABLE", PRICING: "FAILED", PHOTOS: "PENDING" })),
    ).toEqual({ done: 2, failed: 1, total: 7 });
  });
});
