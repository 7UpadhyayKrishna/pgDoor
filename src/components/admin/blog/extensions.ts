import { Node, mergeAttributes } from "@tiptap/core";

/** Highlighted box (tip, info, warning) that holds normal paragraphs. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,
  addAttributes() {
    return {
      tone: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-tone") ?? "info",
        renderHTML: (attrs) => ({ "data-tone": attrs.tone }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes, { "data-callout": "", class: "blog-callout" }), 0];
  },
});

function atomAttrs(keys: string[]) {
  return Object.fromEntries(
    keys.map((key) => [
      key,
      {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute(`data-${key}`) ?? "",
        renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${key}`]: attrs[key] }),
      },
    ]),
  );
}

/** A single PG card, resolved by slug when the post renders. */
export const PgEmbed = Node.create({
  name: "pgEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return atomAttrs(["slug", "title"]);
  },
  parseHTML() {
    return [{ tag: "div[data-pg-embed]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-pg-embed": "", class: "blog-embed" }),
      `PG card · ${node.attrs.title || node.attrs.slug}`,
    ];
  },
});

/** A live list of PGs in a city or area. */
export const PgList = Node.create({
  name: "pgList",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { ...atomAttrs(["citySlug", "areaSlug", "title"]), limit: { default: 4 } };
  },
  parseHTML() {
    return [{ tag: "div[data-pg-list]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const where = [node.attrs.areaSlug, node.attrs.citySlug].filter(Boolean).join(", ");
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-pg-list": "", class: "blog-embed" }),
      `PG list · ${node.attrs.title || where} (${node.attrs.limit})`,
    ];
  },
});

/** Call-to-action box with a button. */
export const Cta = Node.create({
  name: "cta",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return atomAttrs(["title", "text", "label", "href"]);
  },
  parseHTML() {
    return [{ tag: "div[data-cta]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-cta": "", class: "blog-embed" }),
      `CTA · ${node.attrs.title} → ${node.attrs.label} (${node.attrs.href})`,
    ];
  },
});
