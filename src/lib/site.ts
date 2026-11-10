const PRODUCTION_URL = "https://www.pgdoor.in";

/** Absolute origin for canonical URLs, sitemaps and Open Graph tags (no trailing slash). */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_URL).replace(/\/$/, "");
}
