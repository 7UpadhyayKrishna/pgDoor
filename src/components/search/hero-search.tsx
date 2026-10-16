"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AreaSearch, buildAreaSearchHref } from "@/components/search/area-search";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildAreaSearchHref(query, when || undefined));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-[28px] bg-white p-3 shadow-card ring-1 ring-border sm:p-4 md:flex-row md:items-end"
    >
      <AreaSearch
        variant="hero"
        className="md:flex-1"
        value={query}
        onValueChange={setQuery}
        availableFrom={when || undefined}
        placeholder="Enter an area name"
      />
      <label className="block min-w-0 md:flex-1">
        <span className="px-2 text-xs font-medium text-muted-foreground">When are you moving?</span>
        <input
          type="date"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="mt-1 h-12 w-full rounded-[20px] border-0 bg-canvas px-4 text-sm font-medium text-ink"
        />
      </label>
      <Button type="submit" size="lg" className="h-12 w-full shrink-0 rounded-[20px] text-base md:w-auto md:px-8">
        Search PGs
      </Button>
    </form>
  );
}
