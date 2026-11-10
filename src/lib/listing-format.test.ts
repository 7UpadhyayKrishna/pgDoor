import { describe, expect, it } from "vitest";
import { formatMeals } from "@/lib/constants";
import { formatDeposit, minKnownDeposit } from "@/lib/format";
import { listingSlug } from "@/lib/utils";

describe("listingSlug", () => {
  it("doesn't repeat a sector that's already in the name", () => {
    expect(listingSlug("Prince PG (Sector 45)", "Sector 45", "Gurgaon")).toBe("prince-pg-sector-45-gurgaon");
  });

  it("appends area and city when the name doesn't have them", () => {
    expect(listingSlug("Zolo Mansion", "MG Road", "Gurgaon")).toBe("zolo-mansion-mg-road-gurgaon");
  });

  it("keeps a different sector from the area", () => {
    expect(listingSlug("Bala ji PG (Sector 40)", "Sector 40", "Gurgaon")).toBe("bala-ji-pg-sector-40-gurgaon");
  });

  it("doesn't treat a partial number as the same sector", () => {
    expect(listingSlug("Sector 4 PG", "Sector 45", "Gurgaon")).toBe("sector-4-pg-sector-45-gurgaon");
  });
});

describe("deposits", () => {
  it("shows Ask owner for an unknown deposit, never ₹0", () => {
    expect(formatDeposit(null)).toBe("Ask owner");
    expect(formatDeposit(undefined)).toBe("Ask owner");
  });

  it("labels a confirmed zero deposit", () => {
    expect(formatDeposit(0)).toBe("No deposit");
  });

  it("takes the minimum over known deposits only", () => {
    expect(minKnownDeposit([null, 27000, 15000])).toBe(15000);
    expect(minKnownDeposit([null, null])).toBeNull();
    expect(minKnownDeposit([])).toBeNull();
  });
});

describe("formatMeals", () => {
  it("lists meals in the order they're served", () => {
    expect(formatMeals(["BREAKFAST", "DINNER", "LUNCH"])).toBe("Breakfast, lunch, dinner");
  });
});
