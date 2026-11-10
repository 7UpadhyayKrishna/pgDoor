"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/admin/blog/form-fields";

type Item = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  _count: { posts: number };
};

const EMPTY = { name: "", slug: "", description: "", seoTitle: "", metaDescription: "" };

export function TaxonomyManager({ kind, items }: { kind: "categories" | "tags"; items: Item[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const singular = kind === "categories" ? "category" : "tag";

  function edit(item?: Item) {
    setError("");
    setEditing(item?.id ?? "new");
    setForm(
      item
        ? {
            name: item.name,
            slug: item.slug,
            description: item.description ?? "",
            seoTitle: item.seoTitle ?? "",
            metaDescription: item.metaDescription ?? "",
          }
        : EMPTY,
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/blog/${kind}${editing && editing !== "new" ? `/${editing}` : ""}`, {
      method: editing && editing !== "new" ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete “${item.name}”? Posts keep their content but lose this ${singular}.`)) return;
    await fetch(`/api/admin/blog/${kind}/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="overflow-hidden rounded-[18px] bg-white shadow-card">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">No {kind} yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    /blog/{singular}/{item.slug} · {item._count.posts} posts
                    {item.metaDescription ? "" : " · no meta description"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => edit(item)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(item)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="h-fit rounded-[18px] bg-white p-5 shadow-card">
        {editing ? (
          <div className="space-y-4">
            <p className="font-semibold">{editing === "new" ? `New ${singular}` : `Edit ${singular}`}</p>
            <Field id="name" label="Name">
              <input id="input-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field id="slug" label="Slug" hint="Leave empty to generate from the name.">
              <input id="input-slug" className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field id="description" label="Intro" hint="Shown at the top of the archive page; write 2–3 helpful sentences, not a keyword list.">
              <textarea id="input-description" className={textareaClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field id="seoTitle" label="SEO title" count={form.seoTitle.length} range={[30, 60]}>
              <input id="input-seoTitle" className={inputClass} value={form.seoTitle} placeholder={`${form.name} guides`} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
            </Field>
            <Field id="metaDescription" label="Meta description" count={form.metaDescription.length} range={[120, 160]}>
              <textarea id="input-metaDescription" className={textareaClass} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            </Field>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button className="w-full" onClick={() => edit()}>
            New {singular}
          </Button>
        )}
      </div>
    </div>
  );
}
