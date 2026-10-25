"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadPhoto } from "./upload";
import type { StepProps } from "./step-basics";

const MAX_PHOTOS = 20;

type Pending = { id: string; preview: string; progress: number; error?: string };

const TIPS = [
  "Each room type, with the bed made",
  "Bathroom and washroom",
  "Kitchen or dining area",
  "Building entrance from the street",
  "Common areas, terrace or balcony",
];

export function StepPhotos({
  draft,
  update,
  errors,
  onUploadingChange,
}: StepProps & { onUploadingChange: (count: number) => void }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const photosRef = useRef(draft.photos);
  photosRef.current = draft.photos;

  const uploading = pending.filter((p) => !p.error).length;
  useEffect(() => onUploadingChange(uploading), [uploading, onUploadingChange]);

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    const room = MAX_PHOTOS - photosRef.current.length - uploading;
    const files = Array.from(list).slice(0, Math.max(room, 0));
    const items = files.map((file) => ({
      file,
      item: { id: crypto.randomUUID(), preview: URL.createObjectURL(file), progress: 0 } as Pending,
    }));
    setPending((curr) => [...curr, ...items.map((i) => i.item)]);

    for (const { file, item } of items) {
      try {
        const url = await uploadPhoto(file, (progress) =>
          setPending((curr) => curr.map((p) => (p.id === item.id ? { ...p, progress } : p))),
        );
        update({ photos: [...photosRef.current, url] });
        photosRef.current = [...photosRef.current, url];
        setPending((curr) => curr.filter((p) => p.id !== item.id));
        URL.revokeObjectURL(item.preview);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setPending((curr) => curr.map((p) => (p.id === item.id ? { ...p, error: message } : p)));
      }
    }
  }

  function move(index: number, delta: number) {
    const next = [...draft.photos];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ photos: next });
  }

  function makeCover(index: number) {
    const next = [...draft.photos];
    const [photo] = next.splice(index, 1);
    update({ photos: [photo, ...next] });
  }

  function remove(index: number) {
    update({ photos: draft.photos.filter((_, i) => i !== index) });
  }

  function dismiss(id: string) {
    setPending((curr) => {
      const item = curr.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return curr.filter((p) => p.id !== id);
    });
  }

  const full = draft.photos.length + uploading >= MAX_PHOTOS;

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] bg-primary-soft p-4 text-sm text-ink">
        <p className="font-semibold">Add at least 5 clear photos so tenants can see the real place.</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-ink/75">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p className="mt-2 text-ink/75">Shoot in daylight, hold the phone horizontally and tidy the room first.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={full}
          onClick={() => cameraInput.current?.click()}
          className="sm:hidden"
        >
          <Camera className="h-5 w-5" />
          Take photo
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={full}
          onClick={() => galleryInput.current?.click()}
          className="col-span-1 sm:col-span-2"
        >
          <ImagePlus className="h-5 w-5" />
          Add photos
        </Button>
        <input
          ref={galleryInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {draft.photos.length} of {MAX_PHOTOS} photos · The first photo is your cover photo
      </p>
      {errors.photos ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.photos}
        </p>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {draft.photos.map((url, index) => (
          <li key={url} className="overflow-hidden rounded-[14px] border border-border bg-white">
            <div className="relative aspect-[4/3] bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`PG photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  Cover
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex">
                <IconButton label="Move left" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ChevronLeft className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Move right"
                  disabled={index === draft.photos.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
              </div>
              <div className="flex">
                {index !== 0 ? (
                  <IconButton label="Set as cover" onClick={() => makeCover(index)}>
                    <Star className="h-4 w-4" />
                  </IconButton>
                ) : null}
                <IconButton label="Delete photo" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
        {pending.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-[14px] border border-border bg-white">
            <div className="relative aspect-[4/3] bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="Uploading photo" className="h-full w-full object-cover opacity-60" />
              {!item.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-ink" />
                  <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/80">
                    <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
            {item.error ? (
              <div className="flex items-start justify-between gap-2 p-2">
                <p className="text-xs text-destructive">{item.error}</p>
                <button type="button" className="shrink-0 text-xs font-semibold underline" onClick={() => dismiss(item.id)}>
                  Dismiss
                </button>
              </div>
            ) : (
              <p className="p-2 text-xs text-muted-foreground">Uploading… {item.progress}%</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas disabled:opacity-30"
    >
      {children}
    </button>
  );
}
