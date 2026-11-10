import { describe, expect, it } from "vitest";
import { propertyTextWhere, queryTokens, scorePropertyForQuery } from "@/modules/search/text-query";

describe("queryTokens", () => {
  it("lowercases and strips punctuation", () => {
    expect(queryTokens("Dunkirk House (Stanza Living)")).toEqual([
      "dunkirk",
      "house",
      "stanza",
      "living",
    ]);
  });
});

describe("propertyTextWhere", () => {
  it("matches a brand on name without needing an area match", () => {
    const where = propertyTextWhere("zolo", []);
    expect(where.OR).toContainEqual({ name: { contains: "zolo", mode: "insensitive" } });
    expect(where.OR?.some((c) => "areaId" in c)).toBe(false);
  });

  it("requires every word of a multi-word query somewhere on the listing", () => {
    const where = propertyTextWhere("Stanza Living", ["a1"]);
    const tokenClause = where.OR?.find((c) => Array.isArray(c.AND));
    expect(tokenClause?.AND).toHaveLength(2);
    expect(where.OR).toContainEqual({ areaId: { in: ["a1"] } });
    expect(where.OR).toContainEqual({ name: { contains: "StanzaLiving", mode: "insensitive" } });
  });

  it("matches addresses for sector searches", () => {
    const where = propertyTextWhere("Sector 48", []);
    expect(where.OR).toContainEqual({ address: { contains: "Sector 48", mode: "insensitive" } });
  });
});

describe("scorePropertyForQuery", () => {
  const areaScores = new Map([["mg-road", 60]]);

  it("ranks an exact name above an area hit", () => {
    const exact = scorePropertyForQuery("Zolo Mansion", { name: "Zolo Mansion", areaId: "x" }, areaScores);
    const area = scorePropertyForQuery("Zolo Mansion", { name: "Other PG", areaId: "mg-road" }, areaScores);
    expect(exact).toBeGreaterThan(area);
  });

  it("matches brand words inside parentheses", () => {
    expect(
      scorePropertyForQuery("stanza", { name: "Dunkirk House (Stanza Living)", areaId: "x" }, new Map()),
    ).toBeGreaterThan(0);
  });

  it("matches compact brand spellings", () => {
    expect(
      scorePropertyForQuery("hello world", { name: "HelloWorld Westend", areaId: "x" }, new Map()),
    ).toBeGreaterThan(0);
  });
});
