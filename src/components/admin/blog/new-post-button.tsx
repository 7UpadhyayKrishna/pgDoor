"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewPostButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setPending(true);
    setError("");
    const res = await fetch("/api/admin/blog/posts", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPending(false);
      setError(data.error ?? "Couldn't create a post");
      return;
    }
    router.push(`/admin/blog/${data.post.id}`);
  }

  return (
    <div className="text-right">
      <Button onClick={create} disabled={pending}>
        <Plus className="h-4 w-4" /> {pending ? "Creating…" : "New post"}
      </Button>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
