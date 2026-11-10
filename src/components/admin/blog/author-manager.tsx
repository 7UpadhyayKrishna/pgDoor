"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, StringList, inputClass, textareaClass } from "@/components/admin/blog/form-fields";

type Author = {
  id: string;
  name: string;
  slug: string;
  jobTitle: string | null;
  bio: string | null;
  credentials: string | null;
  expertise: string[];
  avatarUrl: string | null;
  sameAs: string[];
  userId: string | null;
  _count: { posts: number };
};

type Form = {
  name: string;
  slug: string;
  jobTitle: string;
  bio: string;
  credentials: string;
  expertise: string[];
  avatarUrl: string;
  sameAs: string[];
  userId: string;
};

const EMPTY: Form = { name: "", slug: "", jobTitle: "", bio: "", credentials: "", expertise: [], avatarUrl: "", sameAs: [], userId: "" };

function eeat(a: Pick<Form, "bio" | "credentials" | "sameAs" | "avatarUrl" | "jobTitle">) {
  const checks = [
    [Boolean(a.bio && a.bio.length >= 120), "Bio of 120+ characters"],
    [Boolean(a.credentials), "Credentials"],
    [a.sameAs.filter(Boolean).length > 0, "Profile links (LinkedIn, X…)"],
    [Boolean(a.avatarUrl), "Photo"],
    [Boolean(a.jobTitle), "Job title"],
  ] as const;
  return checks;
}

export function AuthorManager({ authors, admins }: { authors: Author[]; admins: { id: string; label: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function edit(a?: Author) {
    setError("");
    setEditing(a?.id ?? "new");
    setForm(
      a
        ? {
            name: a.name,
            slug: a.slug,
            jobTitle: a.jobTitle ?? "",
            bio: a.bio ?? "",
            credentials: a.credentials ?? "",
            expertise: a.expertise,
            avatarUrl: a.avatarUrl ?? "",
            sameAs: a.sameAs,
            userId: a.userId ?? "",
          }
        : EMPTY,
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    const isNew = editing === "new";
    const res = await fetch(`/api/admin/blog/authors${isNew ? "" : `/${editing}`}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, sameAs: form.sameAs.filter(Boolean), expertise: form.expertise.filter(Boolean) }),
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

  async function remove(a: Author) {
    if (!window.confirm(`Delete ${a.name}? Their posts will have no author.`)) return;
    await fetch(`/api/admin/blog/authors/${a.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-3">
        {authors.length === 0 ? (
          <p className="rounded-[18px] bg-white px-6 py-10 text-center text-sm text-muted-foreground shadow-card">No authors yet.</p>
        ) : null}
        {authors.map((a) => {
          const checks = eeat({ ...a, bio: a.bio ?? "", credentials: a.credentials ?? "", avatarUrl: a.avatarUrl ?? "", jobTitle: a.jobTitle ?? "" });
          const done = checks.filter(([ok]) => ok).length;
          return (
            <div key={a.id} className="flex items-start gap-4 rounded-[18px] bg-white p-4 shadow-card">
              {a.avatarUrl ? (
                // Author photo from an arbitrary URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">{a.name[0]}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{a.name}</p>
                <p className="text-sm text-muted-foreground">
                  {a.jobTitle ?? "No job title"} · {a._count.posts} posts
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  E-E-A-T profile {done}/{checks.length}
                  {done < checks.length ? ` · missing ${checks.filter(([ok]) => !ok).map(([, l]) => l.toLowerCase()).join(", ")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(a)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a)}>
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-fit rounded-[18px] bg-white p-5 shadow-card">
        {editing ? (
          <div className="space-y-4">
            <p className="font-semibold">{editing === "new" ? "New author" : "Edit author"}</p>
            <Field id="name" label="Name">
              <input id="input-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field id="jobTitle" label="Job title">
              <input id="input-jobTitle" className={inputClass} placeholder="Housing editor, pgDoor" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </Field>
            <Field id="bio" label="Bio" hint="Real, first-person experience: how long you've covered PGs and rentals in NCR, what you check." count={form.bio.length} range={[120, 600]}>
              <textarea id="input-bio" className={textareaClass} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </Field>
            <Field id="credentials" label="Credentials">
              <input id="input-credentials" className={inputClass} placeholder="Visited 300+ PGs in Gurgaon since 2022" value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} />
            </Field>
            <Field id="expertise" label="Topics (knowsAbout)">
              <StringList id="expertise" values={form.expertise} onChange={(v) => setForm({ ...form, expertise: v })} placeholder="PG rentals in Gurgaon" addLabel="Add topic" />
            </Field>
            <Field id="sameAs" label="Profile links (sameAs)" hint="LinkedIn, X, personal site. Confirms to Google and AI engines that this is a real person.">
              <StringList id="sameAs" values={form.sameAs} onChange={(v) => setForm({ ...form, sameAs: v })} placeholder="https://www.linkedin.com/in/…" addLabel="Add link" />
            </Field>
            <Field id="avatarUrl" label="Photo URL">
              <input id="input-avatarUrl" className={inputClass} value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
            </Field>
            <Field id="userId" label="Linked admin account" hint="New posts by this admin default to this author.">
              <select id="input-userId" className={inputClass} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">None</option>
                {admins.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="slug" label="Slug" hint="Leave empty to generate from the name.">
              <input id="input-slug" className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <div className="rounded-[12px] bg-canvas p-3 text-xs">
              <p className="mb-1 font-semibold text-ink">E-E-A-T preview</p>
              <ul className="space-y-0.5">
                {eeat(form).map(([ok, label]) => (
                  <li key={label} className={ok ? "text-success" : "text-muted-foreground"}>
                    {ok ? "✓" : "○"} {label}
                  </li>
                ))}
              </ul>
            </div>
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
            New author
          </Button>
        )}
      </div>
    </div>
  );
}
