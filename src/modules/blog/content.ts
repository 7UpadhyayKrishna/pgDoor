import { slugify } from "@/lib/utils";
import type { DocMark, DocNode, TocItem } from "@/modules/blog/types";

const WORDS_PER_MINUTE = 220;
const QUESTION_START =
  /^(what|how|why|when|where|which|who|whom|whose|can|could|is|are|do|does|did|should|will|would|has|have|kya|kaise)\b/i;

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "tableCell",
  "tableHeader",
  "callout",
]);

export type DocLink = { href: string; text: string; internal: boolean; nofollow: boolean };
export type DocImage = { src: string; alt: string; caption: string };
export type QuestionHeading = { text: string; level: number; answerWords: number };

export type DocAnalysis = {
  wordCount: number;
  readingMinutes: number;
  toc: TocItem[];
  headings: { level: number; text: string }[];
  h2Count: number;
  plainText: string;
  firstWords: string;
  images: DocImage[];
  links: DocLink[];
  internalLinks: number;
  externalLinks: number;
  embeds: { type: string; attrs: Record<string, unknown> }[];
  questionHeadings: QuestionHeading[];
  avgSentenceWords: number;
};

export function nodeText(node: DocNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  return (node.content ?? []).map(nodeText).join(node.type && BLOCK_TYPES.has(node.type) ? "" : " ");
}

export function countWords(text: string) {
  const words = text.trim().match(/[\p{L}\p{N}](?:[\p{L}\p{N}'’-]|[.,](?=\p{N}))*/gu);
  return words ? words.length : 0;
}

export function isQuestion(text: string) {
  const t = text.trim();
  return t.endsWith("?") || QUESTION_START.test(t);
}

export function isInternalHref(href: string, siteHost = "pgdoor.in") {
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  if (href.startsWith("#")) return true;
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return host === siteHost.replace(/^www\./, "");
  } catch {
    return false;
  }
}

function linkMark(marks?: readonly DocMark[]) {
  return marks?.find((m) => m.type === "link");
}

function embedHref(node: DocNode): string | null {
  const attrs = node.attrs ?? {};
  if (node.type === "pgEmbed" && attrs.slug) return `/pg/${attrs.slug}`;
  if (node.type === "pgList" && attrs.citySlug) {
    return `/pgs/${attrs.citySlug}${attrs.areaSlug ? `/${attrs.areaSlug}` : ""}`;
  }
  if (node.type === "cta" && typeof attrs.href === "string") return attrs.href;
  return null;
}

/** Stable, unique heading anchors in document order ("faq", "faq-2", ...). */
export function headingIds(headings: string[]) {
  const seen = new Map<string, number>();
  return headings.map((text) => {
    const base = slugify(text) || "section";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}

/** Copy of the doc with `attrs.id` on every heading, matching the TOC anchors. */
export function withHeadingIds(doc: DocNode): DocNode {
  const texts: string[] = [];
  const collect = (node: DocNode) => {
    if (node.type === "heading") texts.push(nodeText(node));
    node.content?.forEach(collect);
  };
  collect(doc);
  const ids = headingIds(texts);
  let i = 0;
  const apply = (node: DocNode): DocNode => {
    const next: DocNode = { ...node };
    if (node.type === "heading") next.attrs = { ...node.attrs, id: ids[i++] };
    if (node.content) next.content = node.content.map(apply);
    return next;
  };
  return apply(doc);
}

export function analyzeDoc(doc: DocNode | null | undefined, siteHost?: string): DocAnalysis {
  const blocks: string[] = [];
  const headings: { level: number; text: string }[] = [];
  const images: DocImage[] = [];
  const links: DocLink[] = [];
  const embeds: DocAnalysis["embeds"] = [];
  const topLevel = doc?.content ?? [];

  const walk = (node: DocNode) => {
    if (node.type === "text") {
      const link = linkMark(node.marks);
      if (link && typeof link.attrs?.href === "string") {
        const href = link.attrs.href;
        const rel = String(link.attrs.rel ?? "");
        links.push({
          href,
          text: node.text ?? "",
          internal: isInternalHref(href, siteHost),
          nofollow: rel.includes("nofollow"),
        });
      }
      return;
    }
    if (node.type === "image") {
      images.push({
        src: String(node.attrs?.src ?? ""),
        alt: String(node.attrs?.alt ?? "").trim(),
        caption: String(node.attrs?.title ?? "").trim(),
      });
      return;
    }
    if (node.type === "pgEmbed" || node.type === "pgList" || node.type === "cta") {
      embeds.push({ type: node.type, attrs: node.attrs ?? {} });
      const href = embedHref(node);
      if (href) links.push({ href, text: String(node.attrs?.title ?? node.type), internal: isInternalHref(href, siteHost), nofollow: false });
      if (node.type === "cta" && node.attrs?.text) blocks.push(String(node.attrs.text));
      return;
    }
    if (node.type === "heading") {
      headings.push({ level: Number(node.attrs?.level ?? 2), text: nodeText(node).trim() });
    }
    if (node.type && BLOCK_TYPES.has(node.type) && node.type !== "callout") {
      const text = nodeText(node).trim();
      if (text) blocks.push(text);
    }
    node.content?.forEach(walk);
  };
  topLevel.forEach(walk);

  // AEO: a question heading should be followed directly by a short, self-contained answer.
  const questionHeadings: QuestionHeading[] = [];
  topLevel.forEach((node, index) => {
    if (node.type !== "heading") return;
    const level = Number(node.attrs?.level ?? 2);
    const text = nodeText(node).trim();
    if (level > 3 || !isQuestion(text)) return;
    const next = topLevel.slice(index + 1).find((n) => n.type !== "image");
    const answerWords = next && next.type === "paragraph" ? countWords(nodeText(next)) : 0;
    questionHeadings.push({ text, level, answerWords });
  });

  const plainText = blocks.join("\n\n");
  const wordCount = countWords(plainText);
  const sentences = plainText.split(/[.!?]+\s/).filter((s) => countWords(s) > 0);
  const ids = headingIds(headings.map((h) => h.text));
  const toc: TocItem[] = [];
  headings.forEach((h, i) => {
    if (h.level <= 3 && h.text) toc.push({ id: ids[i], text: h.text, level: h.level });
  });

  return {
    wordCount,
    readingMinutes: wordCount ? Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)) : 0,
    toc,
    headings,
    h2Count: headings.filter((h) => h.level === 2).length,
    plainText,
    firstWords: plainText.split(/\s+/).slice(0, 100).join(" "),
    images,
    links,
    internalLinks: links.filter((l) => l.internal).length,
    externalLinks: links.filter((l) => !l.internal).length,
    embeds,
    questionHeadings,
    avgSentenceWords: sentences.length ? Math.round(wordCount / sentences.length) : 0,
  };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeUrl(href: string, siteUrl: string) {
  if (href.startsWith("/")) return `${siteUrl}${href}`;
  return /^(https?:|mailto:)/i.test(href) ? href : "#";
}

/** Escaped HTML for RSS `content:encoded`; embeds become plain links. */
export function docToHtml(doc: DocNode | null | undefined, siteUrl = ""): string {
  const inline = (nodes: readonly DocNode[] = []): string =>
    nodes
      .map((node) => {
        if (node.type === "hardBreak") return "<br>";
        if (node.type !== "text") return inline(node.content);
        let html = escapeHtml(node.text ?? "");
        for (const mark of node.marks ?? []) {
          if (mark.type === "bold") html = `<strong>${html}</strong>`;
          else if (mark.type === "italic") html = `<em>${html}</em>`;
          else if (mark.type === "code") html = `<code>${html}</code>`;
          else if (mark.type === "strike") html = `<s>${html}</s>`;
          else if (mark.type === "link" && typeof mark.attrs?.href === "string") {
            html = `<a href="${escapeHtml(safeUrl(mark.attrs.href, siteUrl))}">${html}</a>`;
          }
        }
        return html;
      })
      .join("");
  const block = (node: DocNode): string => {
    const children = () => (node.content ?? []).map(block).join("");
    switch (node.type) {
      case "paragraph":
        return `<p>${inline(node.content)}</p>`;
      case "heading": {
        const level = Math.min(Math.max(Number(node.attrs?.level ?? 2), 2), 4);
        return `<h${level}>${inline(node.content)}</h${level}>`;
      }
      case "bulletList":
        return `<ul>${children()}</ul>`;
      case "orderedList":
        return `<ol>${children()}</ol>`;
      case "listItem":
        return `<li>${children()}</li>`;
      case "blockquote":
      case "callout":
        return `<blockquote>${children()}</blockquote>`;
      case "codeBlock":
        return `<pre><code>${escapeHtml(nodeText(node))}</code></pre>`;
      case "horizontalRule":
        return "<hr>";
      case "image":
        return `<figure><img src="${escapeHtml(safeUrl(String(node.attrs?.src ?? ""), siteUrl))}" alt="${escapeHtml(String(node.attrs?.alt ?? ""))}">${node.attrs?.title ? `<figcaption>${escapeHtml(String(node.attrs.title))}</figcaption>` : ""}</figure>`;
      case "table":
        return `<table>${children()}</table>`;
      case "tableRow":
        return `<tr>${children()}</tr>`;
      case "tableHeader":
        return `<th>${children()}</th>`;
      case "tableCell":
        return `<td>${children()}</td>`;
      case "pgEmbed":
      case "pgList":
      case "cta": {
        const href = embedHref(node);
        const label = String(node.attrs?.title || node.attrs?.label || "See PGs on pgDoor");
        return href ? `<p><a href="${escapeHtml(safeUrl(href, siteUrl))}">${escapeHtml(label)}</a></p>` : "";
      }
      default:
        return children();
    }
  };
  return (doc?.content ?? []).map(block).join("");
}

function inlineMarkdown(nodes: readonly DocNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type !== "text") return inlineMarkdown(node.content);
      let text = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = `**${text}**`;
        else if (mark.type === "italic") text = `_${text}_`;
        else if (mark.type === "code") text = `\`${text}\``;
        else if (mark.type === "strike") text = `~~${text}~~`;
        else if (mark.type === "link" && typeof mark.attrs?.href === "string") text = `[${text}](${mark.attrs.href})`;
      }
      return text;
    })
    .join("");
}

/** Clean markdown for llms-full.txt and /blog/md/[slug]; relative links become absolute. */
export function docToMarkdown(doc: DocNode | null | undefined, siteUrl = ""): string {
  const abs = (href: string) => (href.startsWith("/") ? `${siteUrl}${href}` : href);
  const block = (node: DocNode, depth = 0): string => {
    const pad = "  ".repeat(depth);
    switch (node.type) {
      case "paragraph":
        return inlineMarkdown(node.content);
      case "heading":
        return `${"#".repeat(Number(node.attrs?.level ?? 2))} ${inlineMarkdown(node.content)}`;
      case "blockquote":
      case "callout":
        return (node.content ?? []).map((c) => `> ${block(c)}`).join("\n>\n");
      case "codeBlock":
        return `\`\`\`\n${nodeText(node)}\n\`\`\``;
      case "horizontalRule":
        return "---";
      case "image":
        return `![${node.attrs?.alt ?? ""}](${abs(String(node.attrs?.src ?? ""))})`;
      case "bulletList":
      case "orderedList":
        return (node.content ?? [])
          .map((item, i) => {
            const marker = node.type === "orderedList" ? `${i + 1}.` : "-";
            const [first, ...rest] = item.content ?? [];
            const head = first ? block(first, depth + 1) : "";
            const tail = rest.map((c) => block(c, depth + 1)).join("\n");
            return `${pad}${marker} ${head}${tail ? `\n${tail}` : ""}`;
          })
          .join("\n");
      case "table": {
        const rows = (node.content ?? []).map((row) =>
          (row.content ?? []).map((cell) => nodeText(cell).replace(/\|/g, "\\|").trim()),
        );
        if (!rows.length) return "";
        const width = Math.max(...rows.map((r) => r.length));
        const line = (r: string[]) => `| ${Array.from({ length: width }, (_, i) => r[i] ?? "").join(" | ")} |`;
        return [line(rows[0]), `|${" --- |".repeat(width)}`, ...rows.slice(1).map(line)].join("\n");
      }
      case "pgEmbed":
      case "pgList":
      case "cta": {
        const href = embedHref(node);
        const label = String(node.attrs?.title || node.attrs?.label || "See PGs on pgDoor");
        return href ? `[${label}](${abs(href)})` : "";
      }
      default:
        return (node.content ?? []).map((c) => block(c, depth)).join("\n\n");
    }
  };
  return (doc?.content ?? [])
    .map((n) => block(n))
    .filter(Boolean)
    .join("\n\n")
    .replace(/\]\((\/[^)]*)\)/g, (_, href: string) => `](${abs(href)})`);
}
