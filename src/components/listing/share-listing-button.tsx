"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareListingButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;
    const url = `${base}/pg/${slug}`;

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: name, url, text: name });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // User cancelled share sheet — ignore AbortError
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // no-op
      }
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-white"
      aria-label="Share"
    >
      <Share2 className="h-5 w-5" />
      {copied ? (
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">
          Link copied
        </span>
      ) : null}
    </button>
  );
}
