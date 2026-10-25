export const LAUNCH_DATE_LABEL = "1 January 2027";
export const LAUNCH_DATE_SHORT = "1 Jan 2027";

export function isPrelaunch() {
  return process.env.NEXT_PUBLIC_PRELAUNCH === "true";
}

const PRELAUNCH_BLOCKED_PAGES = [
  "/pgs",
  "/pg",
  "/compare",
  "/saved",
  "/account",
  "/register",
  "/blog",
  "/about",
  "/help",
];

const PRELAUNCH_BLOCKED_APIS = [
  "/api/search",
  "/api/pgs",
  "/api/leads",
  "/api/saved",
  "/api/visits",
  "/api/reports",
  "/api/landmarks",
  "/api/places/layers",
  "/api/places/nearby",
  "/api/locations/suggest",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPrelaunchBlockedPage(pathname: string) {
  return matchesPrefix(pathname, PRELAUNCH_BLOCKED_PAGES);
}

export function isPrelaunchBlockedApi(pathname: string) {
  return matchesPrefix(pathname, PRELAUNCH_BLOCKED_APIS);
}
