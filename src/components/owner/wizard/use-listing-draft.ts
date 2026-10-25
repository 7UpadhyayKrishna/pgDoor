"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emptyDraft, type ListingDraft } from "./draft";

type Stored = { version: 1; step: number; draft: ListingDraft };

/** Keeps the listing form in localStorage so a refresh or the OTP step never loses progress. */
export function useListingDraft(storageKey: string | null, initial: ListingDraft) {
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(!storageKey);
  const initialRef = useRef(initial);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as Stored;
        if (stored.version === 1) {
          setDraft({ ...emptyDraft(), ...stored.draft });
          setStep(stored.step ?? 0);
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hydrated) return;
    const stored: Stored = { version: 1, step, draft };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [storageKey, hydrated, draft, step]);

  const update = useCallback((patch: Partial<ListingDraft>) => {
    setDraft((curr) => ({ ...curr, ...patch }));
  }, []);

  const clear = useCallback(() => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    setDraft(initialRef.current);
    setStep(0);
  }, [storageKey]);

  return { draft, update, step, setStep, clear, hydrated };
}
