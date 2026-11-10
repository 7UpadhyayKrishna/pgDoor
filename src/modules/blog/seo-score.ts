import { countWords, type DocAnalysis } from "@/modules/blog/content";
import type { AuthorSignals, PostFields } from "@/modules/blog/types";

export type CheckGroup = "seo" | "aeo" | "geo";
export type CheckStatus = "pass" | "warn" | "fail";

export type ScoreCheck = {
  id: string;
  group: CheckGroup;
  status: CheckStatus;
  label: string;
  message: string;
  weight: number;
  /** Editor field to focus when the check is clicked. */
  field: string;
};

export type PostScore = {
  seo: number;
  aeo: number;
  geo: number;
  total: number;
  checks: ScoreCheck[];
};

type ScoreInput = Pick<
  PostFields,
  | "title"
  | "slug"
  | "seoTitle"
  | "metaDescription"
  | "focusKeyword"
  | "secondaryKeywords"
  | "canonicalUrl"
  | "coverImageUrl"
  | "coverAlt"
  | "ogImageUrl"
  | "schemaType"
  | "tldr"
  | "keyTakeaways"
  | "faqs"
  | "howToSteps"
  | "aiSummary"
  | "statistics"
  | "citations"
  | "entities"
  | "lastFactCheckedAt"
  | "targetCityId"
  | "excerpt"
>;

export const SCORE_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  metaMin: 120,
  metaMax: 160,
  minWords: 800,
  densityMin: 0.5,
  densityMax: 2.5,
  tldrMin: 40,
  tldrMax: 60,
  faqMin: 3,
  faqAnswerMin: 40,
  faqAnswerMax: 300,
  takeawaysMin: 3,
  questionHeadingsMin: 2,
  shortAnswerMax: 60,
  statsMin: 2,
  citationsMin: 3,
  aiSummaryMin: 80,
  factCheckDays: 180,
  slugWordsMax: 5,
};

const L = SCORE_LIMITS;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Occurrences of a phrase as whole words, case-insensitive; "PGs" counts for "PG". */
export function phraseCount(text: string, phrase: string) {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const body = words.map((w) => `${escapeRegex(w)}(?:s|es)?`).join("\\s+");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${body}(?=$|[^\\p{L}\\p{N}])`, "giu");
  return (text.match(re) ?? []).length;
}

function contains(text: string, phrase: string) {
  return phraseCount(text, phrase) > 0;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function score(checks: ScoreCheck[]) {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  if (!total) return 100;
  const earned = checks.reduce(
    (sum, c) => sum + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0),
    0,
  );
  return Math.round((earned / total) * 100);
}

export function scorePost(post: ScoreInput, analysis: DocAnalysis, author: AuthorSignals = null, now = new Date()): PostScore {
  const checks: ScoreCheck[] = [];
  const add = (
    group: CheckGroup,
    id: string,
    label: string,
    status: CheckStatus,
    message: string,
    field: string,
    weight = 1,
  ) => checks.push({ id, group, label, status, message, field, weight });

  const kw = post.focusKeyword.trim();
  const seoTitle = (post.seoTitle || post.title).trim();
  const meta = (post.metaDescription || post.excerpt).trim();

  // ---------- SEO ----------
  const titleLen = seoTitle.length;
  add(
    "seo",
    "title-length",
    "SEO title length",
    titleLen >= L.titleMin && titleLen <= L.titleMax ? "pass" : titleLen ? "warn" : "fail",
    `${titleLen} characters (aim for ${L.titleMin}–${L.titleMax}).`,
    "seoTitle",
    2,
  );
  const metaLen = meta.length;
  add(
    "seo",
    "meta-length",
    "Meta description length",
    metaLen >= L.metaMin && metaLen <= L.metaMax ? "pass" : metaLen ? "warn" : "fail",
    `${metaLen} characters (aim for ${L.metaMin}–${L.metaMax}).`,
    "metaDescription",
    2,
  );
  if (!kw) {
    add("seo", "focus-keyword", "Focus keyword", "fail", "Set the search phrase this post should rank for.", "focusKeyword", 3);
  } else {
    add("seo", "kw-title", "Keyword in SEO title", contains(seoTitle, kw) ? "pass" : "fail", `"${kw}" should appear in the SEO title.`, "seoTitle", 2);
    add("seo", "kw-h1", "Keyword in headline", contains(post.title, kw) ? "pass" : "warn", `Use "${kw}" in the H1 headline.`, "title");
    add(
      "seo",
      "kw-slug",
      "Keyword in URL",
      contains(post.slug.replace(/-/g, " "), kw.replace(/[^\p{L}\p{N}]+/gu, " ")) ? "pass" : "warn",
      "Include the keyword in the slug.",
      "slug",
    );
    add("seo", "kw-meta", "Keyword in meta description", contains(meta, kw) ? "pass" : "warn", "Mention the keyword in the meta description.", "metaDescription");
    add("seo", "kw-intro", "Keyword in introduction", contains(analysis.firstWords, kw) ? "pass" : "warn", "Use the keyword in the first 100 words.", "content");
    const density = analysis.wordCount ? (phraseCount(analysis.plainText, kw) * countWords(kw) * 100) / analysis.wordCount : 0;
    add(
      "seo",
      "kw-density",
      "Keyword density",
      density >= L.densityMin && density <= L.densityMax ? "pass" : density > L.densityMax ? "fail" : "warn",
      `${density.toFixed(1)}% (aim for ${L.densityMin}–${L.densityMax}%, avoid stuffing).`,
      "content",
    );
    add(
      "seo",
      "kw-subheading",
      "Keyword in a subheading",
      analysis.headings.some((h) => contains(h.text, kw) || post.secondaryKeywords.some((s) => contains(h.text, s))) ? "pass" : "warn",
      "Use the focus or a secondary keyword in at least one H2/H3.",
      "content",
    );
  }
  add("seo", "word-count", "Content length", analysis.wordCount >= L.minWords ? "pass" : analysis.wordCount >= L.minWords / 2 ? "warn" : "fail", `${analysis.wordCount} words (aim for ${L.minWords}+ for guides).`, "content", 2);
  add("seo", "h2-count", "Section headings", analysis.h2Count >= 2 ? "pass" : "warn", `${analysis.h2Count} H2 headings (use at least 2).`, "content");
  const missingAlt = analysis.images.filter((i) => !i.alt).length;
  add(
    "seo",
    "image-alt",
    "Image alt text",
    missingAlt === 0 ? "pass" : "fail",
    missingAlt ? `${missingAlt} image(s) have no alt text.` : analysis.images.length ? "All images have alt text." : "No inline images.",
    "content",
  );
  add("seo", "internal-links", "Internal links", analysis.internalLinks >= 2 ? "pass" : analysis.internalLinks ? "warn" : "fail", `${analysis.internalLinks} links to pgDoor pages (aim for 2+: PGs, cities, other posts).`, "content", 2);
  add("seo", "external-links", "Outbound links", analysis.externalLinks >= 1 ? "pass" : "warn", `${analysis.externalLinks} links to other sites (cite at least 1 authority).`, "content");
  add("seo", "cover", "Cover image", post.coverImageUrl ? (post.coverAlt ? "pass" : "warn") : "fail", post.coverImageUrl ? (post.coverAlt ? "Cover image with alt text." : "Add alt text to the cover image.") : "Add a cover image (also used for social cards).", "coverImageUrl");
  add("seo", "og-image", "Social image", post.ogImageUrl || post.coverImageUrl ? "pass" : "warn", "Set an Open Graph image (falls back to the cover).", "ogImageUrl");
  const slugWords = post.slug.split("-").filter(Boolean).length;
  add("seo", "slug", "Short URL", slugWords > 0 && slugWords <= L.slugWordsMax ? "pass" : "warn", `${slugWords} words in the slug (keep it to ${L.slugWordsMax} or fewer).`, "slug");
  if (post.canonicalUrl) {
    add("seo", "canonical", "Canonical URL", isValidUrl(post.canonicalUrl) ? "pass" : "fail", "Canonical URL must be a full https:// address.", "canonicalUrl");
  }

  // ---------- AEO ----------
  const tldrWords = countWords(post.tldr);
  add("aeo", "tldr", "Answer-first summary", tldrWords >= L.tldrMin && tldrWords <= L.tldrMax ? "pass" : tldrWords ? "warn" : "fail", `${tldrWords} words (aim for ${L.tldrMin}–${L.tldrMax}; answer the main question directly).`, "tldr", 3);
  const faqs = post.faqs.filter((f) => f.q.trim() && f.a.trim());
  const badFaq = faqs.filter((f) => f.a.length < L.faqAnswerMin || f.a.length > L.faqAnswerMax).length;
  add("aeo", "faq-count", "FAQs", faqs.length >= L.faqMin ? "pass" : faqs.length ? "warn" : "fail", `${faqs.length} FAQs (aim for ${L.faqMin}+, phrased as people search).`, "faqs", 3);
  if (faqs.length) {
    add("aeo", "faq-length", "FAQ answer length", badFaq ? "warn" : "pass", badFaq ? `${badFaq} answer(s) outside ${L.faqAnswerMin}–${L.faqAnswerMax} characters.` : "Answers are snippet-sized.", "faqs");
    add("aeo", "faq-question", "FAQs are questions", faqs.every((f) => f.q.trim().endsWith("?")) ? "pass" : "warn", "End each FAQ question with a question mark.", "faqs");
  }
  const takeaways = post.keyTakeaways.filter((t) => t.trim()).length;
  add("aeo", "takeaways", "Key takeaways", takeaways >= L.takeawaysMin ? "pass" : takeaways ? "warn" : "fail", `${takeaways} takeaways (aim for ${L.takeawaysMin}–6 one-line facts).`, "keyTakeaways", 2);
  const qh = analysis.questionHeadings;
  add("aeo", "question-headings", "Question-style headings", qh.length >= L.questionHeadingsMin ? "pass" : qh.length ? "warn" : "fail", `${qh.length} H2/H3 headings phrased as questions (aim for ${L.questionHeadingsMin}+).`, "content", 2);
  if (qh.length) {
    const long = qh.filter((q) => q.answerWords === 0 || q.answerWords > L.shortAnswerMax).length;
    add("aeo", "short-answers", "Direct answers under questions", long === 0 ? "pass" : "warn", long ? `${long} question heading(s) aren't followed by a short paragraph (≤${L.shortAnswerMax} words) that answers it.` : "Each question is answered right away.", "content", 2);
  }
  if (post.schemaType === "HOW_TO") {
    const steps = post.howToSteps.filter((s) => s.name.trim() && s.text.trim()).length;
    add("aeo", "howto-steps", "How-to steps", steps >= 3 ? "pass" : steps ? "warn" : "fail", `${steps} steps (a how-to needs at least 3).`, "howToSteps", 2);
  }

  // ---------- GEO ----------
  const stats = post.statistics.filter((s) => s.claim.trim() && s.value.trim());
  const sourcedStats = stats.filter((s) => isValidUrl(s.sourceUrl)).length;
  add("geo", "statistics", "Sourced statistics", sourcedStats >= L.statsMin ? "pass" : stats.length ? "warn" : "fail", `${sourcedStats} statistics with a source link (aim for ${L.statsMin}+; AI engines quote numbers).`, "statistics", 2);
  const citations = post.citations.filter((c) => isValidUrl(c.url)).length;
  add("geo", "citations", "Citations", citations >= L.citationsMin ? "pass" : citations ? "warn" : "fail", `${citations} sources cited (aim for ${L.citationsMin}+ authoritative sources).`, "citations", 2);
  const linkedEntities = post.entities.filter((e) => e.name.trim() && e.sameAs && isValidUrl(e.sameAs)).length;
  add("geo", "entities", "Entities", linkedEntities >= 1 ? "pass" : post.entities.length ? "warn" : "fail", `${linkedEntities} entities linked to Wikipedia/Wikidata/official sites (aim for 1+).`, "entities");
  const authorOk = Boolean(author?.bio?.trim() && author?.credentials?.trim() && author?.sameAs?.length);
  add("geo", "author", "Author expertise", authorOk ? "pass" : author ? "warn" : "fail", author ? (authorOk ? `${author.name} has a bio, credentials and profiles.` : `Complete ${author.name}'s bio, credentials and profile links.`) : "Assign an author with a real bio.", "authorId", 2);
  const checkedAt = post.lastFactCheckedAt ? new Date(post.lastFactCheckedAt) : null;
  const fresh = checkedAt && !Number.isNaN(checkedAt.getTime()) && now.getTime() - checkedAt.getTime() <= L.factCheckDays * 86_400_000;
  add("geo", "freshness", "Fact-checked recently", fresh ? "pass" : checkedAt ? "warn" : "fail", fresh ? "Facts checked in the last 6 months." : `Fact-check the post and set the date (within ${L.factCheckDays} days).`, "lastFactCheckedAt");
  const aiWords = countWords(post.aiSummary);
  add("geo", "ai-summary", "AI summary", aiWords >= L.aiSummaryMin ? "pass" : aiWords ? "warn" : "fail", `${aiWords} words (aim for ${L.aiSummaryMin}+ plain, factual words an AI can quote).`, "aiSummary", 2);
  add("geo", "local", "Local targeting", post.targetCityId ? "pass" : "warn", post.targetCityId ? "Targets a city." : "Set a target city for local answers (e.g. Gurgaon).", "targetCityId");

  const byGroup = (g: CheckGroup) => checks.filter((c) => c.group === g);
  const seo = score(byGroup("seo"));
  const aeo = score(byGroup("aeo"));
  const geo = score(byGroup("geo"));
  return { seo, aeo, geo, total: Math.round(seo * 0.5 + aeo * 0.25 + geo * 0.25), checks };
}

export function scoreTone(value: number) {
  return value >= 80 ? "good" : value >= 50 ? "ok" : "poor";
}
