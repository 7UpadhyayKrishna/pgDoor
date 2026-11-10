const PRODUCTION_URL = "https://www.pgdoor.in";

function isLocalUrl(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(url);
}

/** Absolute origin for canonical URLs, sitemaps and Open Graph tags (no trailing slash). */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  // A localhost value copied from .env.example must never leak into production links.
  if (!configured || (process.env.NODE_ENV === "production" && isLocalUrl(configured))) {
    return PRODUCTION_URL;
  }
  return configured.replace(/\/$/, "");
}
