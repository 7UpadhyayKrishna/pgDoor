"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleDashed, ImagePlus, Loader2, Minus, X } from "lucide-react";
import type { CheckStatus, VerificationCheckType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadPhoto } from "@/components/owner/wizard/upload";

export type ChecklistItem = {
  type: VerificationCheckType;
  title: string;
  hint: string;
  status: CheckStatus;
  notes: string;
  evidenceUrls: string[];
  checkedBy: string | null;
  checkedAt: string | null;
};

const STATUS_OPTIONS: { value: CheckStatus; label: string; icon: typeof Check; active: string }[] = [
  { value: "PASSED", label: "Pass", icon: Check, active: "border-green-600 bg-green-50 text-green-700" },
  { value: "FAILED", label: "Fail", icon: X, active: "border-red-600 bg-red-50 text-red-700" },
  { value: "NOT_APPLICABLE", label: "N/A", icon: Minus, active: "border-slate-500 bg-slate-100 text-slate-700" },
  { value: "PENDING", label: "Pending", icon: CircleDashed, active: "border-amber-500 bg-amber-50 text-amber-700" },
];

function CheckRow({ propertyId, item }: { propertyId: string; item: ChecklistItem }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.notes);
  const [evidence, setEvidence] = useState(item.evidenceUrls);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty =
    status !== item.status || notes !== item.notes || evidence.join("|") !== item.evidenceUrls.join("|");

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/pgs/${propertyId}/checks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: item.type, status, notes, evidenceUrls: evidence }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    router.refresh();
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 10 - evidence.length)) {
        urls.push(await uploadPhoto(file, () => {}, "verification"));
      }
      setEvidence((curr) => [...curr, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <li className="rounded-[16px] border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.hint}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  status === opt.value ? opt.active : "border-border text-muted-foreground hover:text-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (what was checked, how, any issues)"
        rows={2}
        className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {evidence.map((url) => (
          <div key={url} className="group relative h-14 w-14 overflow-hidden rounded-lg bg-canvas">
            <a href={url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Evidence" className="h-full w-full object-cover" />
            </a>
            <button
              type="button"
              aria-label="Remove evidence photo"
              onClick={() => setEvidence((curr) => curr.filter((u) => u !== url))}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {evidence.length < 10 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:text-ink"
            aria-label="Add evidence photo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {item.checkedAt
            ? `Last ticked by ${item.checkedBy ?? "admin"} · ${new Date(item.checkedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}`
            : "Not checked yet"}
        </p>
        <div className="flex items-center gap-2">
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
          <Button type="button" size="sm" onClick={save} disabled={!dirty || saving || uploading}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </li>
  );
}

export function VerificationChecklist({ propertyId, items }: { propertyId: string; items: ChecklistItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <CheckRow
          key={`${item.type}:${item.status}:${item.checkedAt ?? ""}`}
          propertyId={propertyId}
          item={item}
        />
      ))}
    </ul>
  );
}
