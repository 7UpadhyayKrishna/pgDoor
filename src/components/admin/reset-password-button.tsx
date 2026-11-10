"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CredentialCard, type Credential } from "@/components/admin/credential-card";

export function ResetPasswordButton({
  ownerProfileId,
  label = "Reset password",
}: {
  ownerProfileId: string;
  label?: string;
}) {
  const router = useRouter();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function reset() {
    if (!window.confirm("Generate a new temporary password? The owner's current password and sessions stop working.")) {
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/owners/${ownerProfileId}/reset-password`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reset password");
      return;
    }
    setCredential(data.credential);
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={reset} disabled={loading}>
        <KeyRound className="h-4 w-4" />
        {loading ? "Resetting…" : label}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <Dialog open={Boolean(credential)} onOpenChange={(open) => !open && setCredential(null)}>
        <DialogContent>
          <DialogTitle>New temporary password</DialogTitle>
          <div className="mt-4">{credential ? <CredentialCard credential={credential} /> : null}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
