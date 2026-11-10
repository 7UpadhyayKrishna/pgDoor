import { describe, expect, it } from "vitest";
import { resolveCityAndArea } from "@/lib/place-resolve";

const cities = [
  {
    id: "noida",
    name: "Noida",
    slug: "noida",
    latitude: 28.5355,
    longitude: 77.391,
    areas: [
      { id: "s62", name: "Sector 62", latitude: 28.627, longitude: 77.3649 },
      { id: "s18", name: "Sector 18", latitude: 28.5706, longitude: 77.3261 },
    ],
  },
];

describe("resolveCityAndArea", () => {
  it("snaps a dropped pin to the nearest area", () => {
    expect(resolveCityAndArea(cities, { latitude: 28.625, longitude: 77.366, cityName: null, areaName: null })).toEqual(
      { cityId: "noida", areaId: "s62" },
    );
  });

  it("leaves pins far outside supported cities unresolved", () => {
    // Mumbai
    expect(resolveCityAndArea(cities, { latitude: 19.076, longitude: 72.8777, cityName: null, areaName: null })).toEqual(
      { cityId: "", areaId: "" },
    );
  });
});
