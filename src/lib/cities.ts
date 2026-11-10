/** Other names people type for a city we already list (official name, old name, spacing). */
export const CITY_SLUG_ALIASES: Record<string, string> = {
  gurugram: "gurgaon",
  "new-delhi": "delhi",
  newdelhi: "delhi",
  "greaternoida": "greater-noida",
  "gr-noida": "greater-noida",
};

/** NCR places we're asked about but don't have a city record for yet. */
export const COMING_SOON_CITIES: Record<string, string> = {
  ncr: "Delhi NCR",
  "delhi-ncr": "Delhi NCR",
  faridabad: "Faridabad",
  ghaziabad: "Ghaziabad",
};
