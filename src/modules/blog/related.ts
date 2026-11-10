export type RelatedCandidate = {
  id: string;
  categoryId: string | null;
  targetCityId: string | null;
  tagIds: string[];
  publishedAt: Date | null;
};

/** Shared tags x3, same category x2, same target city x1; newest first on ties. */
export function rankRelated<T extends RelatedCandidate>(target: RelatedCandidate, candidates: T[], limit = 3): T[] {
  const tags = new Set(target.tagIds);
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => ({
      c,
      score:
        c.tagIds.filter((t) => tags.has(t)).length * 3 +
        (target.categoryId && c.categoryId === target.categoryId ? 2 : 0) +
        (target.targetCityId && c.targetCityId === target.targetCityId ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (b.c.publishedAt?.getTime() ?? 0) - (a.c.publishedAt?.getTime() ?? 0))
    .slice(0, limit)
    .map((r) => r.c);
}
