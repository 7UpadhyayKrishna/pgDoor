import { describe, expect, it } from "vitest";
import { isShortMapLink, parseCoordinates } from "@/lib/map-link";

describe("parseCoordinates", () => {
  it("reads plain coordinates", () => {
    expect(parseCoordinates("28.6270, 77.3649")).toEqual({ latitude: 28.627, longitude: 77.3649 });
    expect(parseCoordinates("28.6270 77.3649")).toEqual({ latitude: 28.627, longitude: 77.3649 });
  });

  it("prefers the place pin over the viewport in a Google Maps URL", () => {
    const url =
      "https://www.google.com/maps/place/Bala+Ji/@28.6100,77.3500,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d28.6123!4d77.3611";
    expect(parseCoordinates(url)).toEqual({ latitude: 28.6123, longitude: 77.3611 });
  });

  it("falls back to the @lat,lng viewport", () => {
    expect(parseCoordinates("https://www.google.com/maps/@28.4595,77.0266,15z")).toEqual({
      latitude: 28.4595,
      longitude: 77.0266,
    });
  });

  it("reads q= and query= parameters", () => {
    expect(parseCoordinates("https://maps.google.com/?q=28.5355,77.3910")).toEqual({
      latitude: 28.5355,
      longitude: 77.391,
    });
    expect(parseCoordinates("https://www.google.com/maps/search/?api=1&query=28.5355%2C77.3910")).toEqual({
      latitude: 28.5355,
      longitude: 77.391,
    });
  });

  it("rejects text without coordinates or with impossible values", () => {
    expect(parseCoordinates("Sector 62 Noida")).toBeNull();
    expect(parseCoordinates("128.5, 77.3")).toBeNull();
    expect(parseCoordinates("%E0%A4")).toBeNull();
  });
});

describe("isShortMapLink", () => {
  it("detects share links that need expanding", () => {
    expect(isShortMapLink("https://maps.app.goo.gl/AbC123")).toBe(true);
    expect(isShortMapLink("https://www.google.com/maps/@28.4,77.0,15z")).toBe(false);
  });
});
