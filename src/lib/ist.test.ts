import { describe, expect, it } from "vitest";
import { endOfIstDay, parseIstDateTimeLocal, startOfIstDay, toIstDateTimeLocal } from "@/lib/ist";

describe("IST helpers", () => {
  it("finds the India day boundaries for a late-evening UTC time", () => {
    // 20:00 UTC on 10 Nov is 01:30 IST on 11 Nov.
    const at = new Date("2026-11-10T20:00:00Z");
    expect(startOfIstDay(at).toISOString()).toBe("2026-11-10T18:30:00.000Z");
    expect(endOfIstDay(at).toISOString()).toBe("2026-11-11T18:29:59.999Z");
  });

  it("round-trips datetime-local values as India time", () => {
    const parsed = parseIstDateTimeLocal("2026-11-12T10:00");
    expect(parsed?.toISOString()).toBe("2026-11-12T04:30:00.000Z");
    expect(toIstDateTimeLocal(parsed!)).toBe("2026-11-12T10:00");
  });

  it("rejects malformed values", () => {
    expect(parseIstDateTimeLocal("tomorrow")).toBeNull();
  });
});
