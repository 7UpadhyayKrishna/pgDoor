"use client";

import type { ListingDraft, StepErrors } from "./draft";
import { ChipGroup, Field, textAreaClass, textInputClass } from "./fields";

export type StepProps = {
  draft: ListingDraft;
  update: (patch: Partial<ListingDraft>) => void;
  errors: StepErrors;
};

const PG_TYPES = [
  { value: "BOYS", label: "Boys" },
  { value: "GIRLS", label: "Girls" },
  { value: "UNISEX", label: "Unisex" },
  { value: "CO_LIVING", label: "Co-living" },
] as const;

const TENANTS = [
  { value: "ANY", label: "Anyone" },
  { value: "STUDENTS", label: "Students" },
  { value: "PROFESSIONALS", label: "Working professionals" },
] as const;

export function StepBasics({ draft, update, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <Field label="PG name" hint="The name tenants will see, e.g. Sunrise Boys PG" error={errors.name} htmlFor="pg-name">
        <input
          id="pg-name"
          className={textInputClass}
          value={draft.name}
          maxLength={120}
          autoComplete="organization"
          placeholder="Your PG name"
          onChange={(e) => update({ name: e.target.value })}
        />
      </Field>

      <Field label="Who is this PG for?" error={errors.pgType}>
        <ChipGroup
          options={[...PG_TYPES]}
          value={draft.pgType}
          onChange={(pgType) => update({ pgType })}
          columns={4}
        />
      </Field>

      <Field label="Preferred tenants">
        <ChipGroup
          options={[...TENANTS]}
          value={draft.preferredTenants}
          onChange={(preferredTenants) => update({ preferredTenants })}
          columns={3}
        />
      </Field>

      <Field
        label="Describe your PG"
        optional
        hint="What makes it a good place to live? Mention nearby offices, colleges, metro and the daily routine."
        htmlFor="pg-description"
      >
        <textarea
          id="pg-description"
          rows={5}
          maxLength={2000}
          className={textAreaClass}
          placeholder="e.g. Fully furnished rooms 5 minutes walk from HUDA City Centre metro. Homely food, daily cleaning and 24x7 power backup."
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{draft.description.length}/2000</p>
      </Field>
    </div>
  );
}
