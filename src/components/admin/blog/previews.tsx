"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function SerpPreview({
  title,
  description,
  slug,
  siteUrl,
  date,
}: {
  title: string;
  description: string;
  slug: string;
  siteUrl: string;
  date?: string;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const host = siteUrl.replace(/^https?:\/\//, "");
  return (
    <div className="rounded-[14px] border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Google preview</p>
        <div className="flex rounded-lg bg-canvas p-0.5 text-xs">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={cn("rounded-md px-2 py-1 capitalize", device === d && "bg-white shadow-sm")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("font-[arial,sans-serif]", device === "mobile" ? "max-w-[360px]" : "max-w-[600px]")}>
        <div className="flex items-center gap-2 text-[12px] text-[#202124]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">pg</span>
          <span>
            <span className="block leading-4">pgDoor</span>
            <span className="block leading-4 text-[#4d5156]">
              {host} › blog › {slug || "post-url"}
            </span>
          </span>
        </div>
        <p className={cn("mt-1 text-[#1a0dab]", device === "mobile" ? "text-[18px] leading-6" : "text-[20px] leading-[26px]")}>
          {truncate(title || "Your SEO title", device === "mobile" ? 70 : 60)}
        </p>
        <p className="mt-1 text-[14px] leading-[22px] text-[#4d5156]">
          {date ? <span className="text-[#70757a]">{date} — </span> : null}
          {truncate(description || "Your meta description will appear here.", device === "mobile" ? 130 : 160)}
        </p>
      </div>
    </div>
  );
}

export function SocialPreview({
  title,
  description,
  image,
  siteUrl,
  variant,
}: {
  title: string;
  description: string;
  image: string;
  siteUrl: string;
  variant: "facebook" | "x";
}) {
  const host = siteUrl.replace(/^https?:\/\//, "").toUpperCase();
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-white">
      <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {variant === "facebook" ? "Facebook / WhatsApp / LinkedIn" : "X (Twitter)"}
      </p>
      <div className="aspect-[1.91/1] bg-canvas">
        {image ? (
          // Preview of an arbitrary uploaded or pasted URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image (add a cover or OG image)</div>
        )}
      </div>
      <div className="space-y-0.5 bg-[#f0f2f5] px-3 py-2">
        <p className="text-[11px] text-[#65676b]">{host}</p>
        <p className="line-clamp-2 text-[15px] font-semibold text-[#050505]">{title || "Post title"}</p>
        <p className="line-clamp-1 text-[13px] text-[#65676b]">{description}</p>
      </div>
    </div>
  );
}
