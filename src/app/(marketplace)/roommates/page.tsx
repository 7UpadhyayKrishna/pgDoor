"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePreferredLocation } from "@/lib/preferred-location";

type Match = { id: string; bio: string | null; destLabel: string | null; user: { id: string; name: string | null } };

export default function RoommatesPage() {
  const dest = usePreferredLocation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/roommates")
      .then((r) => r.json())
      .then((data) => setMatches(data.matches ?? []))
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function optIn() {
    if (!dest) {
      setMessage("Set a destination on search first.");
      return;
    }
    await fetch("/api/roommates", {
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
    setMessage("You're opted in. Chat opens only after both accept.");
    load();
  }

  async function accept(otherUserId: string) {
    const res = await fetch("/api/roommates", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    });
    const data = await res.json();
    setMessage(data.canChat ? "You can now chat — both accepted." : "Waiting for the other person to accept.");
  }

  return (
    <div className="container-pg py-8">
      <h1 className="text-2xl font-bold">Roommate matching</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Opt in to meet people going to the same destination cluster. Chat only after both accept.
      </p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Habits, sleep time, food..."
        className="mt-4 min-h-24 w-full rounded-[18px] border border-input p-3 text-sm"
      />
      <Button className="mt-3" onClick={optIn}>
        Opt in
      </Button>
      {message ? <p className="mt-2 text-sm text-primary">{message}</p> : null}
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
