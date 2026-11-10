"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pgName, setPgName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, pgName: pgName || undefined, message }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't send your message. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm font-medium text-ink">
        Thanks! We&apos;ve got your details and will call you on +91 {phone}.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Your name</Label>
          <Input id="contact-name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="contact-phone">Mobile number</Label>
          <Input
            id="contact-phone"
            className="mt-2"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="contact-pg">PG name (optional)</Label>
        <Input id="contact-pg" className="mt-2" value={pgName} onChange={(e) => setPgName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="contact-message">How can we help?</Label>
        <textarea
          id="contact-message"
          className="mt-2 min-h-24 w-full rounded-[12px] border border-input bg-white px-3 py-2 text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          required
        />
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
