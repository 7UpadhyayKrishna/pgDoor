export function mapsConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY);
}

export function staticMapUrl(lat: number, lng: number, zoom = 14) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=800x400&markers=color:0xFF6B5A|${lat},${lng}&key=${key}`;
}

/**
 * The keyed Embed API renders a blank frame when billing or the API is off on the
 * project, and a cross-origin iframe can't report that. Only use it when explicitly
 * enabled; the keyless embed always renders a pin.
 */
export function mapsEmbedUrl(lat: number, lng: number) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || process.env.GOOGLE_MAPS_EMBED_API !== "true") {
    return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}&zoom=15`;
}

export function googleMapsPlaceUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
