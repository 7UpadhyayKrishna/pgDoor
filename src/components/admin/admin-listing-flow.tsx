"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListingWizard, type CreatedListing } from "@/components/owner/wizard/listing-wizard";
import type { WizardCity } from "@/components/owner/wizard/step-location";
import type { WizardAmenity } from "@/components/owner/wizard/step-amenities";
import type { ListingDraft } from "@/components/owner/wizard/draft";
import { CredentialCard } from "@/components/admin/credential-card";

type IssuedOwner = {
  ownerProfileId: string;
  name: string | null;
  phone: string;
  tempPassword: string | null;
  existing: boolean;
};

type Props = {
  cities: WizardCity[];
  amenities: WizardAmenity[];
  launchLabel: string;
  prospectId?: string;
  initialOwner?: { name: string; phone: string; businessName: string };
  prefill?: Partial<ListingDraft>;
};

export function AdminListingFlow({ cities, amenities, launchLabel, prospectId, initialOwner, prefill }: Props) {
  const [ownerForm, setOwnerForm] = useState(initialOwner ?? { name: "", phone: "", businessName: "" });
  const [owner, setOwner] = useState<IssuedOwner | null>(null);
  const [created, setCreated] = useState<CreatedListing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveOwner(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/owners", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...ownerForm, businessName: ownerForm.businessName || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save the owner");
      return;
    }
    setOwner(data.owner);
  }

  if (owner && created) {
    const createdName = created.name ?? "";
    return (
      <div className="space-y-5 rounded-[24px] bg-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-bold">{createdName || "PG"} is listed</h2>
            <p className="text-sm text-muted-foreground">
              It is under review. Tick the verification checklist, then approve it to go live.
            </p>
          </div>
        </div>
        {owner.tempPassword ? (
          <CredentialCard
            credential={{ name: owner.name, phone: owner.phone, tempPassword: owner.tempPassword }}
            pgName={createdName}
          />
        ) : (
          <p className="rounded-[14px] bg-canvas px-4 py-3 text-sm">
            This owner already has a login ({owner.phone}). They will see the new PG in their dashboard.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/admin/pgs/${created.id}`}>Open verification checklist</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/pgs/new">List another PG</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (owner) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 shadow-card">
          <p className="flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4" />
            <span className="font-semibold">{owner.name ?? "Owner"}</span>
            <span className="text-muted-foreground">{owner.phone}</span>
            {owner.existing ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">existing account</span>
            ) : null}
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOwner(null)}>
            Change
          </Button>
        </div>
        <ListingWizard
          mode="create"
          cities={cities}
          amenities={amenities}
          loggedIn
          launchLabel={launchLabel}
          prefill={{ contactName: owner.name ?? "", contactPhone: owner.phone.replace(/^\+91/, ""), ...prefill }}
          draftKey={`pgdoor:admin-draft:${owner.ownerProfileId}`}
          submitUrl={`/api/admin/owners/${owner.ownerProfileId}/properties${
            prospectId ? `?prospectId=${encodeURIComponent(prospectId)}` : ""
          }`}
          onCreated={setCreated}
        />
      </div>
    );
  }

  return (
    <form onSubmit={saveOwner} className="space-y-4 rounded-[24px] bg-white p-6 shadow-card">
      <div>
        <h2 className="text-lg font-semibold">Step 1: PG owner</h2>
        <p className="text-sm text-muted-foreground">
          A login is created for this mobile number. You&apos;ll get a temporary password to share after the
          listing is saved.
        </p>
      </div>
      <div>
        <Label htmlFor="owner-name">Owner name</Label>
        <Input
          id="owner-name"
          className="mt-2"
          value={ownerForm.name}
          onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="owner-phone">Owner mobile</Label>
        <Input
          id="owner-phone"
          className="mt-2"
          placeholder="10-digit mobile"
          value={ownerForm.phone}
          onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="owner-business">Business name (optional)</Label>
        <Input
          id="owner-business"
          className="mt-2"
          value={ownerForm.businessName}
          onChange={(e) => setOwnerForm({ ...ownerForm, businessName: e.target.value })}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Continue to PG details"}
      </Button>
    </form>
  );
}
