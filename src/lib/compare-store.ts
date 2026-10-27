"use client";

import { useSyncExternalStore } from "react";
import { COMPARE_LIMIT } from "@/lib/constants";

export type CompareItem = { slug: string; name: string };

const KEY = "pgdoor_compare";
const EVENT = "pgdoor-compare-change";
const EMPTY: CompareItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CompareItem[] = EMPTY;

function read(): CompareItem[] {
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "[]") as unknown[];
    // Older builds stored bare slugs.
    cachedItems = parsed
      .map((entry) =>
        typeof entry === "string"
          ? { slug: entry, name: entry }
          : (entry as CompareItem),
      )
      .filter((entry) => entry && typeof entry.slug === "string")
      .slice(-COMPARE_LIMIT);
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function write(items: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function toggleCompare(item: CompareItem) {
  const current = read();
  const next = current.some((c) => c.slug === item.slug)
    ? current.filter((c) => c.slug !== item.slug)
    : [...current, item].slice(-COMPARE_LIMIT);
  write(next);
}

export function removeCompare(slug: string) {
  write(read().filter((c) => c.slug !== slug));
}

export function clearCompare() {
  write([]);
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCompareItems() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
