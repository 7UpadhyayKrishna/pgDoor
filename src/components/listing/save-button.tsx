"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveButton({
  propertyId,
  initiallySaved = false,
  className,
}: {
  propertyId: string;
  initiallySaved?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const next = !saved;
    setSaved(next);
    setPending(true);
    try {
      const res = await fetch("/api/saved", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (!res.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Unsave" : "Save"}
      aria-pressed={saved}
      onClick={toggle}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-card",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5", saved ? "fill-primary text-primary" : "text-ink")} />
    </button>
  );
}
