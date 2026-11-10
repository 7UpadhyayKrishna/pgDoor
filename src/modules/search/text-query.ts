import type { Prisma } from "@prisma/client";
import { scoreAreaMatch } from "@/modules/locations/score";

const MAX_TOKENS = 5;

export function queryTokens(q: string) {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_TOKENS);
}

const insensitive = (value: string) => ({ contains: value, mode: "insensitive" as const });

/**
 * Free-text PG search: a property matches when its area matched the query, or its
 * name / address contains the whole query, or every word appears somewhere in its
 * name, address, area or city ("zolo mansion", "stanza sohna").
 */
export function propertyTextWhere(q: string, matchedAreaIds: string[]): Prisma.PropertyWhereInput {
  const trimmed = q.trim();
  const compact = trimmed.replace(/\s+/g, "");
  const tokens = queryTokens(trimmed);
  const or: Prisma.PropertyWhereInput[] = [
    { name: insensitive(trimmed) },
    { address: insensitive(trimmed) },
  ];
  if (compact !== trimmed) or.push({ name: insensitive(compact) });
  if (matchedAreaIds.length) or.push({ areaId: { in: matchedAreaIds } });
  if (tokens.length > 1) {
    or.push({
      AND: tokens.map((token) => ({
        OR: [
          { name: insensitive(token) },
          { address: insensitive(token) },
          { area: { name: insensitive(token) } },
          { city: { name: insensitive(token) } },
        ],
      })),
    });
  }
  return { OR: or };
}

/** Ranks name hits just above an equally good area hit so "Zolo Mansion" leads its own search. */
export function scorePropertyForQuery(
  q: string,
  property: { name: string; areaId: string },
  areaScores: Map<string, number>,
) {
  const nameScore = scoreAreaMatch(q, property.name);
  const compactScore = scoreAreaMatch(q.replace(/\s+/g, ""), property.name.replace(/\s+/g, ""));
  const best = Math.max(nameScore, compactScore);
  return Math.max(best > 0 ? best + 10 : 0, areaScores.get(property.areaId) ?? 0);
}
