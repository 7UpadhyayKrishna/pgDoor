"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({
  askCurrent,
  next,
}: {
  askCurrent: boolean;
  next: string;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/password/change", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: askCurrent ? currentPassword : undefined, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not update password");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {askCurrent ? (
        <div>
          <Label htmlFor="cur-pwd">Current password</Label>
          <Input
            id="cur-pwd"
            className="mt-2"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="new-pwd">New password</Label>
        <Input
          id="new-pwd"
          className="mt-2"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="confirm-pwd">Confirm new password</Label>
        <Input
          id="confirm-pwd"
          className="mt-2"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>
        Save password
      </Button>
    </form>
  );
}
