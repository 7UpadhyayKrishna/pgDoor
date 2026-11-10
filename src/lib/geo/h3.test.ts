import { describe, expect, it } from "vitest";
import { H3_RES, cellFor, sameCell } from "@/lib/geo/h3";

describe("H3 destination snapping", () => {
  it("uses resolution 9", () => {
    expect(H3_RES).toBe(9);
  });

  it("maps nearby office-park coordinates to the same cell", () => {
    const cyberHub = cellFor(28.495, 77.089);
    const nearby = cellFor(28.4952, 77.0891);
    expect(cyberHub).toBe(nearby);
    expect(sameCell(28.495, 77.089, 28.4952, 77.0891)).toBe(true);
  });

  it("keeps distant destinations in different cells", () => {
    expect(sameCell(28.495, 77.089, 28.46, 77.07)).toBe(false);
  });
});
