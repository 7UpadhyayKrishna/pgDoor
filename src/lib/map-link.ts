export type LatLng = { latitude: number; longitude: number };

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

function valid(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

function match(text: string, pattern: string) {
  const m = text.match(new RegExp(pattern));
  return m ? valid(Number(m[1]), Number(m[2])) : null;
}

/**
 * Reads coordinates from "28.62, 77.36" or a full Google Maps URL. Prefers the place pin
 * (`!3d…!4d…`) over the map viewport centre (`@lat,lng`).
 */
export function parseCoordinates(input: string): LatLng | null {
  let text = input.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // Keep the raw text; coordinates don't need decoding.
  }
  if (!text) return null;
  return (
    match(text, `!3d${NUM}!4d${NUM}`) ??
    match(text, `[?&](?:q|query|ll|destination|center)=(?:loc:)?${NUM},\\s*${NUM}`) ??
    match(text, `@${NUM},${NUM}`) ??
    match(text, `^${NUM}°?\\s*[,\\s]\\s*${NUM}°?$`)
  );
}

/** Short share links (maps.app.goo.gl) must be expanded on the server before parsing. */
export function isShortMapLink(input: string) {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(input.trim());
}
