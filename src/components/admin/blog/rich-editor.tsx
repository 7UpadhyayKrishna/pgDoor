"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Building2,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Megaphone,
  MessageSquareQuote,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Undo2,
  LayoutList,
} from "lucide-react";
import { uploadPhoto } from "@/components/owner/wizard/upload";
import { Callout, Cta, PgEmbed, PgList } from "@/components/admin/blog/extensions";
import type { DocNode, EditorCity } from "@/components/admin/blog/editor-types";
import { cn } from "@/lib/utils";

type PgResult = { id: string; slug: string; name: string; place: string };

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-canvas disabled:opacity-40",
        active && "bg-primary-soft text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onImage,
  onPanel,
}: {
  editor: Editor;
  onImage: () => void;
  onPanel: (panel: "link" | "pg" | "pgList" | "cta") => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      callout: e.isActive("callout"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-white/95 p-1.5 backdrop-blur">
      <ToolButton label="Heading 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Heading 3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Heading 4" active={state.h4} onClick={() => chain().toggleHeading({ level: 4 }).run()}>
        <Heading4 className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Inline code" active={state.code} onClick={() => chain().toggleCode().run()}>
        <Code className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Link" active={state.link} onClick={() => onPanel("link")}>
        <Link2 className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Callout box"
        active={state.callout}
        onClick={() =>
          state.callout
            ? chain().lift("callout").run()
            : chain().wrapIn("callout", { tone: "tip" }).run()
        }
      >
        <MessageSquareQuote className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <Table className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Image" onClick={onImage}>
        <ImagePlus className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Embed a PG" onClick={() => onPanel("pg")}>
        <Building2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Embed PGs in a city or area" onClick={() => onPanel("pgList")}>
        <LayoutList className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Call to action" onClick={() => onPanel("cta")}>
        <Megaphone className="h-4 w-4" />
      </ToolButton>
      <span className="ml-auto" />
      <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolButton>
    </div>
  );
}

const panelInput = "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm";

function LinkPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = editor.getAttributes("link");
  const [href, setHref] = useState<string>(current.href ?? "");
  const [nofollow, setNofollow] = useState<boolean>(String(current.rel ?? "").includes("nofollow"));
  function apply() {
    const value = href.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const internal = value.startsWith("/");
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href: value,
          target: internal ? null : "_blank",
          rel: internal ? null : `noopener noreferrer${nofollow ? " nofollow" : ""}`,
        })
        .run();
    }
    onClose();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        autoFocus
        className={cn(panelInput, "min-w-64 flex-1")}
        placeholder="/pgs/gurgaon or https://…"
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
      />
      <label className="flex items-center gap-1.5 text-xs">
        <input type="checkbox" checked={nofollow} onChange={(e) => setNofollow(e.target.checked)} />
        nofollow (sponsored or untrusted)
      </label>
      <button type="button" onClick={apply} className="h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white">
        {href.trim() ? "Apply" : "Remove link"}
      </button>
    </div>
  );
}

function PgPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PgResult[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/admin/blog/pg-search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div>
      <input autoFocus className={panelInput} placeholder="Search PG name or area…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-2 max-h-48 overflow-auto text-sm">
        {results.map((pg) => (
          <li key={pg.id}>
            <button
              type="button"
              className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-canvas"
              onClick={() => {
                editor.chain().focus().insertContent({ type: "pgEmbed", attrs: { slug: pg.slug, title: pg.name } }).run();
                onClose();
              }}
            >
              <span className="font-medium">{pg.name}</span> <span className="text-muted-foreground">· {pg.place}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PgListPanel({ editor, cities, onClose }: { editor: Editor; cities: EditorCity[]; onClose: () => void }) {
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? "");
  const [areaSlug, setAreaSlug] = useState("");
  const [title, setTitle] = useState("");
  const [limit, setLimit] = useState(4);
  const city = cities.find((c) => c.slug === citySlug);
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_5rem_auto]">
      <select className={panelInput} value={citySlug} onChange={(e) => (setCitySlug(e.target.value), setAreaSlug(""))}>
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select className={panelInput} value={areaSlug} onChange={(e) => setAreaSlug(e.target.value)}>
        <option value="">Whole city</option>
        {city?.areas.map((a) => (
          <option key={a.slug} value={a.slug}>
            {a.name}
          </option>
        ))}
      </select>
      <input className={panelInput} placeholder="Heading, e.g. PGs near Cyber City" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className={panelInput} type="number" min={1} max={8} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 4)} />
      <button
        type="button"
        className="h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white"
        onClick={() => {
          editor.chain().focus().insertContent({ type: "pgList", attrs: { citySlug, areaSlug, title, limit } }).run();
          onClose();
        }}
      >
        Insert
      </button>
    </div>
  );
}

function CtaPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [title, setTitle] = useState("Find a PG near your office");
  const [text, setText] = useState("Compare rent plus commute cost for PGs across Gurgaon.");
  const [label, setLabel] = useState("Search PGs");
  const [href, setHref] = useState("/pgs");
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input className={panelInput} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className={panelInput} placeholder="Text" value={text} onChange={(e) => setText(e.target.value)} />
      <input className={panelInput} placeholder="Button label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <div className="flex gap-2">
        <input className={panelInput} placeholder="/pgs" value={href} onChange={(e) => setHref(e.target.value)} />
        <button
          type="button"
          className="h-9 shrink-0 rounded-lg bg-primary px-3 text-sm font-semibold text-white"
          onClick={() => {
            editor.chain().focus().insertContent({ type: "cta", attrs: { title, text, label, href } }).run();
            onClose();
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

export default function RichEditor({
  value,
  onChange,
  cities,
}: {
  value: DocNode;
  onChange: (doc: DocNode) => void;
  cities: EditorCity[];
}) {
  const [panel, setPanel] = useState<null | "link" | "pg" | "pgList" | "cta">(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Start with the answer. Then explain, with H2 questions people actually search…" }),
      CharacterCount,
      Callout,
      PgEmbed,
      PgList,
      Cta,
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class: "blog-prose min-h-[480px] max-w-none px-5 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getJSON() as DocNode),
  });

  async function insertImage(file: File) {
    if (!editor) return;
    const alt = window.prompt("Describe the image for screen readers and Google (alt text):", file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    if (alt === null) return;
    if (!alt.trim()) {
      setUploadError("Alt text is required for every image.");
      return;
    }
    const caption = window.prompt("Caption (optional):", "") ?? "";
    setUploadError("");
    setUploading((n) => n + 1);
    try {
      const url = await uploadPhoto(file, () => undefined, "blog");
      editor.chain().focus().setImage({ src: url, alt: alt.trim(), title: caption.trim() || undefined }).run();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading((n) => n - 1);
    }
  }

  const words =
    useEditorState({
      editor,
      selector: ({ editor: e }) => (e ? e.storage.characterCount.words() : 0),
    }) ?? 0;

  if (!editor) return <div className="h-[540px] animate-pulse rounded-[18px] bg-white" />;

  return (
    <div id="field-content" className="overflow-hidden rounded-[18px] border border-border bg-white">
      <Toolbar editor={editor} onImage={() => fileRef.current?.click()} onPanel={(p) => setPanel((cur) => (cur === p ? null : p))} />
      {panel ? (
        <div className="border-b border-border bg-canvas p-2">
          {panel === "link" ? <LinkPanel editor={editor} onClose={() => setPanel(null)} /> : null}
          {panel === "pg" ? <PgPanel editor={editor} onClose={() => setPanel(null)} /> : null}
          {panel === "pgList" ? <PgListPanel editor={editor} cities={cities} onClose={() => setPanel(null)} /> : null}
          {panel === "cta" ? <CtaPanel editor={editor} onClose={() => setPanel(null)} /> : null}
        </div>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void insertImage(file);
        }}
      />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {words} words · {Math.max(1, Math.round(words / 220))} min read
        </span>
        <span>
          {uploading ? "Uploading image…" : null}
          {uploadError ? <span className="text-error">{uploadError}</span> : null}
        </span>
      </div>
    </div>
  );
}
