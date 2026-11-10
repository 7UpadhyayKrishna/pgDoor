"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

function photoAlt(photo: { alt?: string | null }, name: string, index: number, total: number) {
  const base = photo.alt && photo.alt !== name ? photo.alt : name;
  return total > 1 ? `${base}, photo ${index + 1} of ${total}` : base;
}

export function Gallery({
  photos,
  name,
  tourVideoUrl,
  tourThumbnailUrl,
}: {
  photos: { url: string; alt?: string | null }[];
  name: string;
  tourVideoUrl?: string | null;
  tourThumbnailUrl?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = photos.length;
  const prev = useCallback(() => setActive((i) => (i === 0 ? total - 1 : i - 1)), [total]);
  const next = useCallback(() => setActive((i) => (i === total - 1 ? 0 : i + 1)), [total]);

  useEffect(() => {
    if (!lightbox || total < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, total, prev, next]);

  const main = photos[active] ?? photos[0];
  if (!main) {
    return <div className="aspect-[4/3] max-h-[55vh] rounded-[20px] bg-canvas md:max-h-[420px]" />;
  }

  const sideIndexes = photos
    .map((_, i) => i)
    .filter((i) => i !== active)
    .slice(0, 3);
  const hasSides = sideIndexes.length > 0;
  const sideRows = Math.max(1, sideIndexes.length);
  const mainAlt = photoAlt(main, name, active, total);

  const arrows = (size: "sm" | "lg") =>
    total > 1 ? (
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-2">
        <button
          type="button"
          className={`pointer-events-auto flex items-center justify-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white ${size === "lg" ? "h-12 w-12" : "h-11 w-11"}`}
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className={`pointer-events-auto flex items-center justify-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white ${size === "lg" ? "h-12 w-12" : "h-11 w-11"}`}
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next photo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    ) : null;

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative md:hidden">
        <button
          type="button"
          className="relative block aspect-[4/3] max-h-[55vh] w-full overflow-hidden rounded-[20px] bg-canvas"
          onClick={() => setLightbox(true)}
          aria-label="Open photo gallery"
        >
          <Image src={main.url} alt={mainAlt} fill className="object-cover" priority sizes="100vw" quality={70} />
        </button>
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">
          {active + 1} / {total}
        </span>
        {arrows("sm")}
      </div>

      {/* Desktop mosaic */}
      <div
        className={
          hasSides
            ? "hidden h-[min(420px,50vh)] gap-2 md:grid md:grid-cols-[2fr_1fr]"
            : "hidden h-[min(420px,50vh)] md:block"
        }
      >
        <div className="relative h-full min-h-0 overflow-hidden rounded-[20px] bg-canvas">
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-in"
            onClick={() => setLightbox(true)}
            aria-label="Open photo gallery"
          >
            <Image
              src={main.url}
              alt={mainAlt}
              fill
              className="object-cover"
              priority
              quality={70}
              sizes={hasSides ? "(max-width: 1280px) 60vw, 720px" : "(max-width: 1280px) 90vw, 1100px"}
            />
          </button>
          {arrows("sm")}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-card hover:bg-white"
          >
            <Expand className="h-3.5 w-3.5" /> View all {total} photos
          </button>
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">
            {active + 1} / {total}
          </span>
        </div>
        {hasSides ? (
          <div
            className="grid h-full min-h-0 gap-2"
            style={{ gridTemplateRows: `repeat(${sideRows}, minmax(0, 1fr))` }}
          >
            {sideIndexes.map((index) => {
              const photo = photos[index];
              return (
                <button
                  key={photo.url + index}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show photo ${index + 1} of ${total}`}
                  className="relative min-h-0 overflow-hidden rounded-[20px] bg-canvas"
                >
                  <Image
                    src={photo.url}
                    alt={photoAlt(photo, name, index, total)}
                    fill
                    className="object-cover"
                    quality={60}
                    sizes="(max-width: 1280px) 30vw, 360px"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <DialogPrimitive.Root open={lightbox} onOpenChange={setLightbox}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/90" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col p-4 outline-none md:p-8">
            <div className="flex items-center justify-between text-white">
              <DialogPrimitive.Title className="text-sm font-medium">
                {name} · {active + 1} / {total}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Use the arrow keys or buttons to move between photos.
              </DialogPrimitive.Description>
              <DialogPrimitive.Close className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
                <X className="h-5 w-5" />
                <span className="sr-only">Close gallery</span>
              </DialogPrimitive.Close>
            </div>
            <div className="relative mt-4 min-h-0 flex-1">
              <Image src={main.url} alt={mainAlt} fill className="object-contain" sizes="100vw" quality={80} />
              {arrows("lg")}
            </div>
            {total > 1 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, index) => (
                  <button
                    key={photo.url + index}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show photo ${index + 1} of ${total}`}
                    aria-current={index === active ? "true" : undefined}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ${index === active ? "ring-white" : "ring-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <Image src={photo.url} alt="" fill className="object-cover" sizes="96px" quality={50} />
                  </button>
                ))}
              </div>
            ) : null}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {tourVideoUrl ? (
        <details className="mt-3 rounded-[18px] bg-white p-3 shadow-card">
          <summary className="cursor-pointer text-sm font-semibold">Virtual tour (60s max)</summary>
          <video
            className="mt-3 w-full rounded-xl"
            controls
            preload="none"
            poster={tourThumbnailUrl ?? undefined}
            src={tourVideoUrl}
          />
        </details>
      ) : null}
    </div>
  );
}
