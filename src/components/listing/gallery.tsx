"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({
  photos,
  name,
}: {
  photos: { url: string; alt?: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const main = photos[active] ?? photos[0];
  if (!main) {
    return <div className="aspect-[4/3] max-h-[55vh] rounded-[20px] bg-canvas md:max-h-[420px]" />;
  }

  const sideIndexes = photos
    .map((_, i) => i)
    .filter((i) => i !== active)
    .slice(0, 3);
  const hasSides = sideIndexes.length > 0;

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative md:hidden">
        <div className="relative aspect-[4/3] max-h-[55vh] overflow-hidden bg-canvas">
          <Image
            src={main.url}
            alt={main.alt ?? name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <span className="absolute bottom-3 right-3 z-10 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">
            {active + 1} / {photos.length}
          </span>
          {photos.length > 1 ? (
            <div className="absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90"
                onClick={() => setActive((i) => (i === 0 ? photos.length - 1 : i - 1))}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90"
                onClick={() => setActive((i) => (i === photos.length - 1 ? 0 : i + 1))}
                aria-label="Next photo"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
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
          <Image
            src={main.url}
            alt={main.alt ?? name}
            fill
            className="object-cover"
            priority
            sizes={hasSides ? "(max-width: 1280px) 60vw, 720px" : "(max-width: 1280px) 90vw, 1100px"}
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">
            {active + 1} / {photos.length}
          </span>
        </div>
        {hasSides ? (
          <div className="grid h-full min-h-0 grid-rows-3 gap-2">
            {sideIndexes.map((index) => {
              const photo = photos[index];
              return (
                <button
                  key={photo.url + index}
                  type="button"
                  onClick={() => setActive(index)}
                  className="relative min-h-0 overflow-hidden rounded-[20px] bg-canvas"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 30vw, 360px"
                  />
                </button>
              );
            })}
            {Array.from({ length: Math.max(0, 3 - sideIndexes.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-[20px] bg-canvas" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
