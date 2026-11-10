import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { renderJSONContentToReactElement } from "@tiptap/static-renderer/json/react";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { isInternalHref, withHeadingIds } from "@/modules/blog/content";
import type { DocNode } from "@/modules/blog/types";

type Ctx = { node: DocNode; children?: ReactNode };
type MarkCtx = { mark: { attrs?: Record<string, unknown> }; children?: ReactNode };

/** Plain attribute values only; anything else in stored JSON is ignored. */
function attr(node: DocNode, key: string) {
  const v = node.attrs?.[key];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function safeHref(href: string) {
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return href;
  return "#";
}

const CALLOUT = {
  info: { icon: Info, className: "border-sky-200 bg-sky-50" },
  tip: { icon: Lightbulb, className: "border-emerald-200 bg-emerald-50" },
  warning: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50" },
} as const;

async function PgEmbedCard({ slug, linkable }: { slug: string; linkable: boolean }) {
  const pg = await prisma.property.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      status: true,
      minRent: true,
      availableBeds: true,
      foodIncluded: true,
      area: { select: { name: true } },
      city: { select: { name: true } },
      photos: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!pg || pg.status !== "PUBLISHED") return null;
  const body = (
    <span className="not-prose flex gap-4 rounded-[18px] bg-white p-3 shadow-card ring-1 ring-border">
      <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-canvas">
        {pg.photos[0] ? <Image src={pg.photos[0].url} alt={pg.name} fill className="object-cover" sizes="112px" quality={60} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{pg.name}</span>
        <span className="block text-sm text-muted-foreground">
          {pg.area.name}, {pg.city.name}
        </span>
        <span className="mt-1 block text-sm font-medium text-ink">
          From {formatInr(pg.minRent)}/month{pg.foodIncluded ? " · Food included" : ""}
          {pg.availableBeds > 0 ? ` · ${pg.availableBeds} beds free` : " · Currently full"}
        </span>
      </span>
    </span>
  );
  return (
    <span className="my-6 block">
      {linkable ? (
        <Link href={`/pg/${pg.slug}`} className="not-prose block hover:opacity-95">
          {body}
        </Link>
      ) : (
        body
      )}
    </span>
  );
}

async function PgListEmbed({
  citySlug,
  areaSlug,
  title,
  limit,
  linkable,
}: {
  citySlug: string;
  areaSlug: string;
  title: string;
  limit: number;
  linkable: boolean;
}) {
  const pgs = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      city: { slug: citySlug },
      ...(areaSlug ? { area: { slug: areaSlug } } : {}),
    },
    orderBy: [{ featured: "desc" }, { availabilityConfirmedAt: "desc" }],
    take: Math.min(Math.max(limit || 4, 1), 8),
    select: { slug: true, name: true, minRent: true, area: { select: { name: true } } },
  });
  if (!pgs.length) return null;
  const href = `/pgs/${citySlug}${areaSlug ? `/${areaSlug}` : ""}`;
  return (
    <div className="not-prose my-6 rounded-[18px] bg-white p-4 shadow-card ring-1 ring-border">
      <p className="font-semibold text-ink">{title || "PGs on pgDoor"}</p>
      <ul className="mt-3 divide-y divide-border text-sm">
        {pgs.map((pg) => (
          <li key={pg.slug} className="flex items-center justify-between gap-3 py-2">
            {linkable ? (
              <Link href={`/pg/${pg.slug}`} className="font-medium text-ink hover:text-primary">
                {pg.name}
              </Link>
            ) : (
              <span className="font-medium text-ink">{pg.name}</span>
            )}
            <span className="shrink-0 text-muted-foreground">
              {pg.area.name} · from {formatInr(pg.minRent)}
            </span>
          </li>
        ))}
      </ul>
      {linkable ? (
        <Link href={href} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          See all PGs →
        </Link>
      ) : null}
    </div>
  );
}

export function renderPostContent(doc: DocNode, opts: { linkable: boolean }): ReactNode {
  const { linkable } = opts;
  const render = renderJSONContentToReactElement({
    nodeMapping: {
      doc: ({ children }: Ctx) => <>{children}</>,
      text: ({ node }: Ctx) => <>{node.text}</>,
      paragraph: ({ children }: Ctx) => <p>{children}</p>,
      heading: ({ node, children }: Ctx) => {
        const level = Math.min(Math.max(Number(node.attrs?.level ?? 2), 2), 4);
        const id = attr(node, "id");
        const Tag = `h${level}` as "h2" | "h3" | "h4";
        return (
          <Tag id={id || undefined} className="group scroll-mt-24">
            {children}
            {id ? (
              <a href={`#${id}`} aria-label="Link to this section" className="ml-2 text-muted-foreground no-underline opacity-0 group-hover:opacity-100">
                #
              </a>
            ) : null}
          </Tag>
        );
      },
      bulletList: ({ children }: Ctx) => <ul>{children}</ul>,
      orderedList: ({ node, children }: Ctx) => <ol start={Number(node.attrs?.start ?? 1)}>{children}</ol>,
      listItem: ({ children }: Ctx) => <li>{children}</li>,
      blockquote: ({ children }: Ctx) => <blockquote>{children}</blockquote>,
      codeBlock: ({ children }: Ctx) => (
        <pre>
          <code>{children}</code>
        </pre>
      ),
      horizontalRule: () => <hr />,
      hardBreak: () => <br />,
      image: ({ node }: Ctx) => {
        const src = attr(node, "src");
        if (!src) return null;
        const caption = attr(node, "title");
        return (
          <figure>
            {/* Blog images come from our own storage at arbitrary sizes; next/image would need fixed dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={attr(node, "alt")} loading="lazy" decoding="async" className="rounded-[18px]" />
            {caption ? <figcaption>{caption}</figcaption> : null}
          </figure>
        );
      },
      table: ({ children }: Ctx) => (
        <div className="overflow-x-auto">
          <table>
            <tbody>{children}</tbody>
          </table>
        </div>
      ),
      tableRow: ({ children }: Ctx) => <tr>{children}</tr>,
      tableHeader: ({ children }: Ctx) => <th>{children}</th>,
      tableCell: ({ children }: Ctx) => <td>{children}</td>,
      callout: ({ node, children }: Ctx) => {
        const tone = CALLOUT[(attr(node, "tone") as keyof typeof CALLOUT) || "info"] ?? CALLOUT.info;
        const Icon = tone.icon;
        return (
          <aside className={`not-prose my-6 flex gap-3 rounded-[18px] border p-4 text-sm leading-6 text-ink ${tone.className}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="space-y-2 [&_p]:m-0">{children}</div>
          </aside>
        );
      },
      pgEmbed: ({ node }: Ctx) => {
        const slug = attr(node, "slug");
        return slug ? <PgEmbedCard slug={slug} linkable={linkable} /> : null;
      },
      pgList: ({ node }: Ctx) => {
        const citySlug = attr(node, "citySlug");
        return citySlug ? (
          <PgListEmbed
            citySlug={citySlug}
            areaSlug={attr(node, "areaSlug")}
            title={attr(node, "title")}
            limit={Number(attr(node, "limit") || 4)}
            linkable={linkable}
          />
        ) : null;
      },
      cta: ({ node }: Ctx) => {
        const href = safeHref(attr(node, "href"));
        const internal = isInternalHref(href);
        const showLink = href !== "#" && (linkable || !internal || !href.startsWith("/pg"));
        return (
          <div className="not-prose my-8 rounded-[24px] bg-primary-soft px-6 py-6">
            <p className="text-lg font-semibold text-ink">{attr(node, "title")}</p>
            {attr(node, "text") ? <p className="mt-1 text-sm text-ink/80">{attr(node, "text")}</p> : null}
            {showLink && attr(node, "label") ? (
              <a
                href={href}
                {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                className="not-prose mt-4 inline-flex min-h-11 items-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                {attr(node, "label")}
              </a>
            ) : null}
          </div>
        );
      },
    },
    markMapping: {
      bold: ({ children }: MarkCtx) => <strong>{children}</strong>,
      italic: ({ children }: MarkCtx) => <em>{children}</em>,
      strike: ({ children }: MarkCtx) => <s>{children}</s>,
      underline: ({ children }: MarkCtx) => <u>{children}</u>,
      code: ({ children }: MarkCtx) => <code>{children}</code>,
      link: ({ mark, children }: MarkCtx) => {
        const href = safeHref(String(mark.attrs?.href ?? ""));
        const internal = isInternalHref(href);
        if (internal && !linkable && /^\/(pgs?|compare)\b/.test(href)) return <>{children}</>;
        if (internal) return <Link href={href}>{children}</Link>;
        const nofollow = String(mark.attrs?.rel ?? "").includes("nofollow");
        return (
          <a href={href} target="_blank" rel={`noopener noreferrer${nofollow ? " nofollow" : ""}`}>
            {children}
          </a>
        );
      },
    },
    unhandledNode: ({ children }: Ctx) => <>{children}</>,
    unhandledMark: ({ children }: MarkCtx) => <>{children}</>,
  });
  return render({ content: withHeadingIds(doc) });
}
