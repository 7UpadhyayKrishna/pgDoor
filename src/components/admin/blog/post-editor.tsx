"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ExternalLink, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadPhoto } from "@/components/owner/wizard/upload";
import { Field, Repeater, StringList, inputClass, textareaClass } from "@/components/admin/blog/form-fields";
import { SerpPreview, SocialPreview } from "@/components/admin/blog/previews";
import { ScorePanel } from "@/components/admin/blog/score-panel";
import type { EditorLookups, PostFields } from "@/components/admin/blog/editor-types";
import { analyzeDoc, countWords } from "@/modules/blog/content";
import { SCORE_LIMITS, scorePost } from "@/modules/blog/seo-score";
import { BLOG_STATUS_LABEL, SCHEMA_TYPE_LABEL, type BlogStatus, type SchemaType } from "@/modules/blog/types";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RichEditor = dynamic(() => import("@/components/admin/blog/rich-editor"), {
  ssr: false,
  loading: () => <div className="h-[540px] animate-pulse rounded-[18px] bg-white" />,
});

type Tab = "seo" | "aeo" | "geo" | "social" | "settings";
const TABS: { id: Tab; label: string }[] = [
  { id: "seo", label: "SEO" },
  { id: "aeo", label: "AEO" },
  { id: "geo", label: "GEO" },
  { id: "social", label: "Social" },
  { id: "settings", label: "Settings" },
];

const FIELD_TAB: Partial<Record<string, Tab>> = {
  seoTitle: "seo",
  metaDescription: "seo",
  focusKeyword: "seo",
  canonicalUrl: "seo",
  tldr: "aeo",
  faqs: "aeo",
  keyTakeaways: "aeo",
  howToSteps: "aeo",
  statistics: "geo",
  citations: "geo",
  entities: "geo",
  lastFactCheckedAt: "geo",
  aiSummary: "geo",
  targetCityId: "geo",
  ogImageUrl: "social",
  authorId: "settings",
  coverImageUrl: "settings",
};

const AUTOSAVE_MS = 1500;
const L = SCORE_LIMITS;

type SaveState = "saved" | "dirty" | "saving" | "error";

export function PostEditor({
  postId,
  initial,
  lookups,
  siteUrl,
  initialLinkedPgs,
}: {
  postId: string;
  initial: { fields: PostFields; status: BlogStatus; publishedAt: string | null; updatedAt: string };
  lookups: EditorLookups;
  siteUrl: string;
  initialLinkedPgs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState(initial.fields);
  const [status, setStatus] = useState(initial.status);
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);
  const [tab, setTab] = useState<Tab>("seo");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<Date>(new Date(initial.updatedAt));
  const [error, setError] = useState("");
  const [tags, setTags] = useState(lookups.tags);
  const [linkedPgs, setLinkedPgs] = useState(initialLinkedPgs);
  const [slugTouched, setSlugTouched] = useState(!initial.fields.slug.startsWith("untitled-"));
  const dirty = useRef(new Set<keyof PostFields>());
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const author = lookups.authors.find((a) => a.id === fields.authorId) ?? null;
  const analysis = useMemo(() => analyzeDoc(fields.contentJson), [fields.contentJson]);
  const score = useMemo(() => scorePost(fields, analysis, author), [fields, analysis, author]);
  const city = lookups.cities.find((c) => c.id === fields.targetCityId);

  const flush = useCallback(
    async (extra: Record<string, unknown> = {}): Promise<boolean> => {
      if (timer.current) clearTimeout(timer.current);
      if (inFlight.current) await inFlight.current;
      const keys = [...dirty.current];
      if (!keys.length && !Object.keys(extra).length) return true;
      dirty.current = new Set();
      const body: Record<string, unknown> = { ...extra };
      for (const key of keys) body[key] = fieldsRef.current[key];
      setSaveState("saving");
      const run = (async () => {
        try {
          const res = await fetch(`/api/admin/blog/posts/${postId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok) {
            keys.forEach((k) => dirty.current.add(k));
            setError(data.error ?? "Couldn't save");
            setSaveState("error");
            return false;
          }
          setError("");
          setStatus(data.post.status);
          setPublishedAt(data.post.publishedAt);
          setSavedAt(new Date(data.post.updatedAt));
          // The server may have adjusted the slug to keep it unique.
          if (data.post.fields.slug !== fieldsRef.current.slug && !dirty.current.has("slug")) {
            setFields((f) => ({ ...f, slug: data.post.fields.slug }));
          }
          setSaveState(dirty.current.size ? "dirty" : "saved");
          return true;
        } catch {
          keys.forEach((k) => dirty.current.add(k));
          setError("Network error. Your changes will retry.");
          setSaveState("error");
          return false;
        }
      })();
      inFlight.current = run;
      const ok = await run;
      inFlight.current = null;
      return ok;
    },
    [postId],
  );

  const set = useCallback(
    <K extends keyof PostFields>(key: K, value: PostFields[K]) => {
      setFields((f) => ({ ...f, [key]: value }));
      dirty.current.add(key);
      setSaveState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [flush],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty.current.size || inFlight.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flush]);

  function jump(field: string) {
    const target = FIELD_TAB[field];
    if (target) setTab(target);
    setTimeout(() => {
      document.getElementById(`field-${field}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      (document.getElementById(`input-${field}`) as HTMLInputElement | null)?.focus({ preventScroll: true });
      if (field === "content") (document.querySelector(".ProseMirror") as HTMLElement | null)?.focus();
    }, 60);
  }

  async function changeStatus(next: BlogStatus) {
    if (next === "PUBLISHED" && score.total < 50 && !window.confirm(`This post scores ${score.total}/100. Publish anyway?`)) return;
    const ok = await flush({ status: next });
    if (ok) router.refresh();
  }

  async function remove() {
    if (!window.confirm("Delete this post permanently?")) return;
    const res = await fetch(`/api/admin/blog/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      dirty.current = new Set();
      router.push("/admin/blog");
      router.refresh();
    }
  }

  async function createTag(name: string) {
    const res = await fetch("/api/admin/blog/tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Couldn't create tag");
      return;
    }
    setTags((t) => [...t, { id: data.item.id, name: data.item.name }].sort((a, b) => a.name.localeCompare(b.name)));
    set("tagIds", [...fieldsRef.current.tagIds, data.item.id]);
  }

  const seoTitle = fields.seoTitle || fields.title;
  const metaDescription = fields.metaDescription || fields.excerpt;
  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "dirty"
        ? "Unsaved changes"
        : saveState === "error"
          ? "Not saved"
          : `Saved ${savedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <div className="space-y-3 rounded-[18px] bg-white p-5 shadow-card">
          <Field id="title" label="Headline (H1)" count={fields.title === "Untitled post" ? 0 : fields.title.length} range={[20, 70]}>
            <input
              id="input-title"
              className={cn(inputClass, "h-12 text-lg font-semibold")}
              value={fields.title === "Untitled post" ? "" : fields.title}
              placeholder="How to find a PG near Cyber City under ₹12,000"
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value).split("-").slice(0, 6).join("-"));
              }}
            />
          </Field>
          <Field id="subtitle" label="Subtitle (optional)">
            <input id="input-subtitle" className={inputClass} value={fields.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field id="slug" label="URL" hint={`${siteUrl}/blog/${fields.slug}`}>
            <input
              id="input-slug"
              className={inputClass}
              value={fields.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value.replace(/\s/g, "-")) || e.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field id="excerpt" label="Excerpt" hint="Shown on blog listings and used as the meta description if that's empty." count={fields.excerpt.length} range={[L.metaMin, L.metaMax]}>
            <textarea id="input-excerpt" className={textareaClass} value={fields.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>
        </div>

        <RichEditor value={fields.contentJson} onChange={(doc) => set("contentJson", doc)} cities={lookups.cities} />

        <div className="rounded-[18px] bg-white shadow-card">
          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-t-lg px-4 py-2 text-sm font-semibold",
                  tab === t.id ? "bg-canvas text-ink" : "text-muted-foreground hover:text-ink",
                )}
              >
                {t.label}
                {t.id === "seo" || t.id === "aeo" || t.id === "geo" ? (
                  <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{score[t.id]}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="space-y-5 p-5">
            {tab === "seo" ? (
              <>
                <SerpPreview
                  title={seoTitle}
                  description={metaDescription}
                  slug={fields.slug}
                  siteUrl={siteUrl}
                  date={publishedAt ? new Date(publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : undefined}
                />
                <Field id="focusKeyword" label="Focus keyword" hint="The one search phrase this post should rank for, e.g. “pg near cyber city”.">
                  <input id="input-focusKeyword" className={inputClass} value={fields.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} />
                </Field>
                <Field id="secondaryKeywords" label="Secondary keywords" hint="Related phrases and synonyms (up to 10). Used in headings and schema keywords.">
                  <StringList id="secondaryKeywords" values={fields.secondaryKeywords} onChange={(v) => set("secondaryKeywords", v)} placeholder="e.g. paying guest in gurgaon" addLabel="Add keyword" />
                </Field>
                <Field id="seoTitle" label="SEO title" hint="Leave empty to use the headline. “· pgDoor” is added automatically." count={seoTitle.length} range={[L.titleMin, L.titleMax]}>
                  <input id="input-seoTitle" className={inputClass} value={fields.seoTitle} placeholder={fields.title} onChange={(e) => set("seoTitle", e.target.value)} />
                </Field>
                <Field id="metaDescription" label="Meta description" count={metaDescription.length} range={[L.metaMin, L.metaMax]}>
                  <textarea id="input-metaDescription" className={textareaClass} value={fields.metaDescription} placeholder={fields.excerpt} onChange={(e) => set("metaDescription", e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="schemaType" label="Schema type" hint="How-to adds HowTo rich results from the steps in AEO.">
                    <select id="input-schemaType" className={inputClass} value={fields.schemaType} onChange={(e) => set("schemaType", e.target.value as SchemaType)}>
                      {(Object.keys(SCHEMA_TYPE_LABEL) as SchemaType[]).map((t) => (
                        <option key={t} value={t}>
                          {SCHEMA_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="canonicalUrl" label="Canonical URL (optional)" hint="Only if this post was first published elsewhere.">
                    <input id="input-canonicalUrl" className={inputClass} value={fields.canonicalUrl} placeholder={`${siteUrl}/blog/${fields.slug}`} onChange={(e) => set("canonicalUrl", e.target.value)} />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={fields.noindex} onChange={(e) => set("noindex", e.target.checked)} /> noindex (hide from search)
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={fields.nofollow} onChange={(e) => set("nofollow", e.target.checked)} /> nofollow (don&apos;t pass link equity)
                  </label>
                </div>
              </>
            ) : null}

            {tab === "aeo" ? (
              <>
                <Field
                  id="tldr"
                  label="Answer-first summary (TL;DR)"
                  hint="Answer the main question in 40–60 words, as if read aloud by a voice assistant. Shown at the top of the post."
                  count={countWords(fields.tldr)}
                  range={[L.tldrMin, L.tldrMax]}
                >
                  <textarea id="input-tldr" className={cn(textareaClass, "min-h-28")} value={fields.tldr} onChange={(e) => set("tldr", e.target.value)} />
                </Field>
                <Field id="keyTakeaways" label="Key takeaways" hint="3–6 one-line facts. Great for featured snippets and AI answers." count={fields.keyTakeaways.filter(Boolean).length} range={[3, 6]}>
                  <StringList id="keyTakeaways" values={fields.keyTakeaways} onChange={(v) => set("keyTakeaways", v)} placeholder="e.g. Most PGs near Cyber City charge ₹9,000–₹14,000 for a double room." addLabel="Add takeaway" />
                </Field>
                <Field id="faqs" label="FAQs" hint="Questions people actually search (People Also Ask). Answers of 40–300 characters. Rendered with FAQPage schema." count={fields.faqs.length} range={[3, 10]}>
                  <Repeater
                    id="faqs"
                    items={fields.faqs}
                    onChange={(v) => set("faqs", v)}
                    empty={{ q: "", a: "" }}
                    addLabel="Add FAQ"
                    columns={[
                      { key: "q", label: "Question", placeholder: "What is the average PG rent near Cyber City?" },
                      { key: "a", label: "Answer", multiline: true },
                    ]}
                  />
                </Field>
                <Field id="howToSteps" label="How-to steps" hint={fields.schemaType === "HOW_TO" ? "Used for HowTo rich results." : "Set schema type to How-to guide to use these."}>
                  <Repeater
                    id="howToSteps"
                    items={fields.howToSteps}
                    onChange={(v) => set("howToSteps", v)}
                    empty={{ name: "", text: "", imageUrl: "" }}
                    addLabel="Add step"
                    columns={[
                      { key: "name", label: "Step name", width: "half" },
                      { key: "imageUrl", label: "Image URL (optional)", type: "url", width: "half" },
                      { key: "text", label: "What to do", multiline: true },
                    ]}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={fields.speakable} onChange={(e) => set("speakable", e.target.checked)} />
                  Mark summary and takeaways as speakable (voice assistants)
                </label>
              </>
            ) : null}

            {tab === "geo" ? (
              <>
                <Field
                  id="aiSummary"
                  label="AI summary"
                  hint="A plain, factual paragraph for ChatGPT, Perplexity and Google AI Overviews: who this is for, the key numbers, and the conclusion. Published in llms.txt and the markdown version."
                  count={countWords(fields.aiSummary)}
                  range={[L.aiSummaryMin, 200]}
                >
                  <textarea id="input-aiSummary" className={cn(textareaClass, "min-h-32")} value={fields.aiSummary} onChange={(e) => set("aiSummary", e.target.value)} />
                </Field>
                <Field id="statistics" label="Statistics with sources" hint="Concrete numbers AI engines can quote. Each needs a source link." count={fields.statistics.length} range={[L.statsMin, 20]}>
                  <Repeater
                    id="statistics"
                    items={fields.statistics}
                    onChange={(v) => set("statistics", v)}
                    empty={{ claim: "", value: "", sourceUrl: "", sourceName: "" }}
                    addLabel="Add statistic"
                    columns={[
                      { key: "claim", label: "Claim", placeholder: "Median double-sharing rent in Sector 45", width: "half" },
                      { key: "value", label: "Value", placeholder: "₹11,500/month", width: "half" },
                      { key: "sourceName", label: "Source name", placeholder: "pgDoor listings, Nov 2026", width: "half" },
                      { key: "sourceUrl", label: "Source URL", type: "url", width: "half" },
                    ]}
                  />
                </Field>
                <Field id="citations" label="Citations" hint="Authoritative sources you relied on (government, DMRC, RBI, news). Shown under “Sources”." count={fields.citations.length} range={[L.citationsMin, 20]}>
                  <Repeater
                    id="citations"
                    items={fields.citations}
                    onChange={(v) => set("citations", v)}
                    empty={{ title: "", url: "", publisher: "", accessedAt: "" }}
                    addLabel="Add citation"
                    columns={[
                      { key: "title", label: "Title", width: "half" },
                      { key: "publisher", label: "Publisher", width: "half" },
                      { key: "url", label: "URL", type: "url", width: "half" },
                      { key: "accessedAt", label: "Accessed on", type: "date", width: "half" },
                    ]}
                  />
                </Field>
                <Field id="entities" label="Entities" hint="People, places and organisations the post is about, linked to Wikipedia/Wikidata/official sites. The first is the main topic (schema about)." count={fields.entities.length}>
                  <Repeater
                    id="entities"
                    items={fields.entities}
                    onChange={(v) => set("entities", v)}
                    empty={{ name: "", type: "Place", sameAs: "" }}
                    addLabel="Add entity"
                    columns={[
                      { key: "name", label: "Name", placeholder: "DLF Cyber City", width: "half" },
                      { key: "type", label: "Schema type", placeholder: "Place, Organization, Thing", width: "half" },
                      { key: "sameAs", label: "sameAs URL", type: "url", placeholder: "https://en.wikipedia.org/wiki/DLF_CyberCity" },
                    ]}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field id="lastFactCheckedAt" label="Last fact-checked">
                    <input id="input-lastFactCheckedAt" type="date" className={inputClass} value={fields.lastFactCheckedAt} onChange={(e) => set("lastFactCheckedAt", e.target.value)} />
                  </Field>
                  <Field id="targetCityId" label="Target city">
                    <select
                      id="input-targetCityId"
                      className={inputClass}
                      value={fields.targetCityId}
                      onChange={(e) => {
                        set("targetCityId", e.target.value);
                        set("targetAreaId", "");
                      }}
                    >
                      <option value="">None</option>
                      {lookups.cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="targetAreaId" label="Target area">
                    <select id="input-targetAreaId" className={inputClass} value={fields.targetAreaId} disabled={!city} onChange={(e) => set("targetAreaId", e.target.value)}>
                      <option value="">Whole city</option>
                      {city?.areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </>
            ) : null}

            {tab === "social" ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <Field id="ogTitle" label="Open Graph title" count={(fields.ogTitle || seoTitle).length} range={[30, 90]}>
                    <input id="input-ogTitle" className={inputClass} value={fields.ogTitle} placeholder={seoTitle} onChange={(e) => set("ogTitle", e.target.value)} />
                  </Field>
                  <Field id="ogDescription" label="Open Graph description">
                    <textarea id="input-ogDescription" className={textareaClass} value={fields.ogDescription} placeholder={metaDescription} onChange={(e) => set("ogDescription", e.target.value)} />
                  </Field>
                  <Field id="ogImageUrl" label="Social image" hint="1200×630 works everywhere. Falls back to the cover image.">
                    <ImageField id="ogImageUrl" value={fields.ogImageUrl} onChange={(v) => set("ogImageUrl", v)} />
                  </Field>
                  <Field id="twitterTitle" label="X title (optional)">
                    <input id="input-twitterTitle" className={inputClass} value={fields.twitterTitle} placeholder={fields.ogTitle || seoTitle} onChange={(e) => set("twitterTitle", e.target.value)} />
                  </Field>
                  <Field id="twitterDescription" label="X description (optional)">
                    <textarea id="input-twitterDescription" className={textareaClass} value={fields.twitterDescription} placeholder={fields.ogDescription || metaDescription} onChange={(e) => set("twitterDescription", e.target.value)} />
                  </Field>
                </div>
                <div className="space-y-4">
                  <SocialPreview variant="facebook" siteUrl={siteUrl} title={fields.ogTitle || seoTitle} description={fields.ogDescription || metaDescription} image={fields.ogImageUrl || fields.coverImageUrl} />
                  <SocialPreview
                    variant="x"
                    siteUrl={siteUrl}
                    title={fields.twitterTitle || fields.ogTitle || seoTitle}
                    description={fields.twitterDescription || fields.ogDescription || metaDescription}
                    image={fields.ogImageUrl || fields.coverImageUrl}
                  />
                </div>
              </div>
            ) : null}

            {tab === "settings" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="authorId" label="Author" hint="Authors with a bio, credentials and profile links build E-E-A-T.">
                    <select id="input-authorId" className={inputClass} value={fields.authorId} onChange={(e) => set("authorId", e.target.value)}>
                      <option value="">No author</option>
                      {lookups.authors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="reviewerId" label="Reviewed / fact-checked by">
                    <select id="input-reviewerId" className={inputClass} value={fields.reviewerId} onChange={(e) => set("reviewerId", e.target.value)}>
                      <option value="">Nobody</option>
                      {lookups.authors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="categoryId" label="Category">
                    <select id="input-categoryId" className={inputClass} value={fields.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                      <option value="">Uncategorised</option>
                      {lookups.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field id="tagIds" label="Tags">
                  <TagPicker tags={tags} value={fields.tagIds} onChange={(v) => set("tagIds", v)} onCreate={createTag} />
                </Field>
                <Field id="coverImageUrl" label="Cover image" hint="Shown at the top of the post, on listings and in Google Discover (1200px wide or more).">
                  <ImageField id="coverImageUrl" value={fields.coverImageUrl} onChange={(v) => set("coverImageUrl", v)} />
                </Field>
                <Field id="coverAlt" label="Cover image alt text">
                  <input id="input-coverAlt" className={inputClass} value={fields.coverAlt} onChange={(e) => set("coverAlt", e.target.value)} />
                </Field>
                <Field id="relatedPropertyIds" label="PGs mentioned" hint="Shown below the post as internal links. Without picks, PGs in the target area are shown.">
                  <PgPicker
                    value={linkedPgs}
                    onChange={(pgs) => {
                      setLinkedPgs(pgs);
                      set("relatedPropertyIds", pgs.map((p) => p.id));
                    }}
                  />
                </Field>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
        <div className="rounded-[18px] bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                status === "PUBLISHED" ? "bg-green-50 text-green-700" : status === "ARCHIVED" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700",
              )}
            >
              {BLOG_STATUS_LABEL[status]}
            </span>
            <span className={cn("flex items-center gap-1 text-xs", saveState === "error" ? "text-error" : "text-muted-foreground")}>
              {saveState === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {saveLabel}
            </span>
          </div>
          {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {status === "PUBLISHED" ? (
              <Button variant="outline" onClick={() => changeStatus("DRAFT")}>
                Unpublish
              </Button>
            ) : (
              <Button onClick={() => changeStatus("PUBLISHED")}>Publish</Button>
            )}
            <Button variant="outline" onClick={() => flush()} disabled={saveState === "saving"}>
              Save now
            </Button>
            <Button asChild variant="ghost">
              <a href={`/blog/${fields.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> {status === "PUBLISHED" ? "View" : "Preview"}
              </a>
            </Button>
            {status !== "ARCHIVED" ? (
              <Button variant="ghost" onClick={() => changeStatus("ARCHIVED")}>
                Archive
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => changeStatus("DRAFT")}>
                Restore
              </Button>
            )}
          </div>
          <button type="button" onClick={remove} className="mt-3 text-xs font-medium text-error hover:underline">
            Delete post
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            {analysis.wordCount} words · {analysis.readingMinutes} min · {analysis.internalLinks} internal / {analysis.externalLinks} external links
          </p>
        </div>
        <ScorePanel score={score} onJump={jump} />
      </aside>
    </div>
  );
}

function ImageField({ id, value, onChange }: { id: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-fit">
          {/* Arbitrary uploaded URL preview. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-28 rounded-xl object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <input id={`input-${id}`} className={inputClass} value={value} placeholder="https://… or upload" onChange={(e) => onChange(e.target.value)} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => ref.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Upload
        </Button>
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setUploading(true);
            setErr("");
            try {
              onChange(await uploadPhoto(file, () => undefined, "blog"));
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Upload failed");
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>
      {err ? <p className="text-xs text-error">{err}</p> : null}
    </div>
  );
}

function TagPicker({
  tags,
  value,
  onChange,
  onCreate,
}: {
  tags: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const selected = new Set(value);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={selected.has(t.id)}
            onClick={() => onChange(selected.has(t.id) ? value.filter((id) => id !== t.id) : [...value, t.id])}
            className={cn(
              "rounded-full px-3 py-1 text-sm ring-1",
              selected.has(t.id) ? "bg-primary text-white ring-primary" : "bg-white text-ink ring-border hover:bg-canvas",
            )}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          id="input-tagIds"
          className={inputClass}
          placeholder="New tag"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              void onCreate(draft.trim()).then(() => setDraft(""));
            }
          }}
        />
        <Button type="button" variant="outline" disabled={!draft.trim()} onClick={() => onCreate(draft.trim()).then(() => setDraft(""))}>
          Add tag
        </Button>
      </div>
    </div>
  );
}

function PgPicker({
  value,
  onChange,
}: {
  value: { id: string; name: string }[];
  onChange: (pgs: { id: string; name: string }[]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; place: string }[]>([]);
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/blog/pg-search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((pg) => (
          <span key={pg.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-sm text-ink">
            {pg.name}
            <button type="button" aria-label={`Remove ${pg.name}`} onClick={() => onChange(value.filter((p) => p.id !== pg.id))}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <input id="input-relatedPropertyIds" className={inputClass} placeholder="Search a PG to link…" value={q} onChange={(e) => setQ(e.target.value)} />
      {results.length ? (
        <ul className="max-h-48 overflow-auto rounded-[10px] border border-border text-sm">
          {results
            .filter((r) => !value.some((v) => v.id === r.id))
            .map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-canvas"
                  onClick={() => {
                    onChange([...value, { id: r.id, name: r.name }]);
                    setQ("");
                  }}
                >
                  <span className="font-medium">{r.name}</span> <span className="text-muted-foreground">· {r.place}</span>
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
