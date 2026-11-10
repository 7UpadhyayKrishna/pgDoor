export function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Higher is better: exact 100, starts-with 80, word-prefix 60, contains 40. */
export function scoreAreaMatch(query: string, areaName: string) {
  const q = normalizeQuery(query);
  if (!q) return 0;
  const name = normalizeQuery(areaName);
  if (!name) return 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  const words = name.split(/[\s()]+/);
  if (words.some((w) => w.startsWith(q))) return 60;
  if (name.includes(q)) return 40;
  return 0;
}
