"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePreferredLocation } from "@/lib/preferred-location";

type Match = { id: string; bio: string | null; destLabel: string | null; user: { id: string; name: string | null } };

const LOGIN_HREF = `/login?next=${encodeURIComponent("/roommates")}`;

export default function RoommatesPage() {
  const dest = usePreferredLocation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/roommates")
      .then(async (r) => {
        if (r.status === 401) {
          setSignedIn(false);
          return;
        }
        setSignedIn(true);
        const data = await r.json();
        setMatches(data.matches ?? []);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function optIn() {
    setError("");
    setMessage("");
    if (!dest) {
      setError("Search with your office or college first, so we know where you commute.");
      return;
    }
    const res = await fetch("/api/roommates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        destLat: dest.lat,
        destLng: dest.lng,
        destLabel: dest.label,
        bio,
        habits: { quiet: true },
        optIn: true,
      }),
    });
    if (res.status === 401) {
      setSignedIn(false);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't opt you in. Please try again.");
      return;
    }
    setMessage("You're opted in. Chat opens only after both accept.");
    load();
  }

  async function accept(otherUserId: string) {
    const res = await fetch("/api/roommates", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't accept this match.");
      return;
    }
    setMessage(data.canChat ? "You can now chat — both accepted." : "Waiting for the other person to accept.");
  }

  return (
    <div className="container-pg py-8">
      <h1 className="text-2xl font-bold">Roommate matching</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Opt in to meet people going to the same destination cluster. Chat only after both accept.
      </p>
      {signedIn === false ? (
        <div className="mt-6 max-w-lg rounded-[18px] bg-primary-soft p-5">
          <p className="font-semibold text-ink">Log in to find roommates</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Roommate matching needs a verified mobile number so everyone knows who they&apos;re
            talking to.
          </p>
          <Button asChild className="mt-4">
            <Link href={LOGIN_HREF}>Log in with OTP</Link>
          </Button>
        </div>
      ) : (
        <>
          <label htmlFor="roommate-bio" className="mt-4 block text-sm font-medium text-ink">
            About you
          </label>
          <textarea
            id="roommate-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Habits, sleep time, food..."
            className="mt-2 min-h-24 w-full rounded-[18px] border border-input p-3 text-sm"
          />
          <Button className="mt-3" onClick={optIn} disabled={signedIn === null}>
            Opt in
          </Button>
        </>
      )}
      {message ? <p className="mt-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {matches.map((m) => (
          <li key={m.id} className="rounded-[18px] bg-white p-4 shadow-card">
            <p className="font-semibold">{m.user.name ?? "pgDoor user"}</p>
            <p className="text-sm text-muted-foreground">{m.destLabel}</p>
            <p className="mt-1 text-sm">{m.bio}</p>
            <Button size="sm" className="mt-3" onClick={() => accept(m.user.id)}>
              Accept
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
