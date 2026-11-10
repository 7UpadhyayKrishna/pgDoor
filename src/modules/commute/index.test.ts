import { describe, expect, it } from "vitest";
import { nearestForLiveRoutes } from "@/modules/commute";

describe("nearestForLiveRoutes", () => {
  it("keeps the closest origins when over the live-route cap", () => {
    const dest = { lat: 28.6, lng: 77.2 };
    const origins = [
      { id: "far", lat: 28.9, lng: 77.5 },
      { id: "near", lat: 28.61, lng: 77.21 },
      { id: "mid", lat: 28.7, lng: 77.3 },
    ];
    expect(nearestForLiveRoutes(origins, dest, 2).map((row) => row.id)).toEqual(["near", "mid"]);
  });

  it("returns all origins when under the cap", () => {
    const origins = [
      { id: "a", lat: 28.6, lng: 77.2 },
      { id: "b", lat: 28.7, lng: 77.3 },
    ];
    expect(nearestForLiveRoutes(origins, { lat: 28.6, lng: 77.2 }, 10)).toHaveLength(2);
  });
});
