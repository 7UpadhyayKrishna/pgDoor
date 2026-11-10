"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteUrl } from "@/lib/site";

export type Credential = {
  name: string | null;
  phone: string;
  tempPassword: string;
};

function loginUrl() {
  return `${siteUrl()}/login`;
}

export function credentialMessage(credential: Credential, pgName?: string) {
  const greeting = credential.name ? `Hi ${credential.name},` : "Hi,";
  const listed = pgName ? ` Your PG "${pgName}" is now listed on pgDoor.` : "";
  return [
    `${greeting}${listed}`,
    "",
    `Log in at ${loginUrl()} (choose "Password")`,
    `Mobile: ${credential.phone}`,
    `Temporary password: ${credential.tempPassword}`,
    "",
    "You'll be asked to set your own password the first time you log in.",
  ].join("\n");
}

export function CredentialCard({ credential, pgName }: { credential: Credential; pgName?: string }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setMessage(credentialMessage(credential, pgName)), [credential, pgName]);

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waHref = `https://wa.me/${credential.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <div className="rounded-[18px] border border-primary/30 bg-primary/5 p-4">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <KeyRound className="h-4 w-4" />
        Owner login credentials
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Mobile</dt>
        <dd className="font-mono">{credential.phone}</dd>
        <dt className="text-muted-foreground">Password</dt>
        <dd className="font-mono text-base font-semibold tracking-wide">{credential.tempPassword}</dd>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Shown only once. Use &quot;Reset password&quot; on the Owners page if it gets lost.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy message"}
        </Button>
        <Button asChild size="sm">
          <a href={waHref} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" />
            Send on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
