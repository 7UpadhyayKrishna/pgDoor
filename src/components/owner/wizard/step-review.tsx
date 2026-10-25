"use client";

import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { MEAL_LABEL, PG_TYPE_LABEL, PREFERRED_TENANTS_LABEL, SHARING_LABEL } from "@/lib/constants";
import { formatGateTime, formatInr } from "@/lib/format";
import { completeness, electricityNote, enabledRooms, fullAddress, toInt } from "./draft";
import { Field, textInputClass } from "./fields";
import type { StepProps } from "./step-basics";
import type { WizardAmenity } from "./step-amenities";
import type { WizardCity } from "./step-location";

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (step: number) => void; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-primary"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </div>
      <div className="mt-1 space-y-1 text-sm text-ink/80">{children}</div>
    </section>
  );
}

export function StepReview({
  draft,
  update,
  errors,
  onEdit,
  cities,
  amenities,
}: StepProps & { onEdit: (step: number) => void; cities: WizardCity[]; amenities: WizardAmenity[] }) {
  const city = cities.find((c) => c.id === draft.cityId);
  const area = city?.areas.find((a) => a.id === draft.areaId);
  const score = completeness(draft);
  const amenityNames = amenities.filter((a) => draft.amenitySlugs.includes(a.slug)).map((a) => a.name);
  const rules = [
    draft.visitorsAllowed ? "Visitors allowed" : "No visitors",
    draft.cookingAllowed ? "Cooking allowed" : "No cooking",
    draft.smokingAllowed ? "Smoking allowed" : "No smoking",
    draft.alcoholAllowed ? "Alcohol allowed" : "No alcohol",
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">Listing completeness</span>
          <span className="font-bold text-primary">{score}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
        </div>
        {score < 100 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            A description, deposits, gate timing and 4+ photos make your listing complete.
          </p>
        ) : null}
      </div>

      {draft.photos.length ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {draft.photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt={`Photo ${i + 1}`} className="h-20 w-28 shrink-0 rounded-[10px] object-cover" />
          ))}
        </div>
      ) : null}

      <Section title="Basics" step={0} onEdit={onEdit}>
        <p className="font-semibold text-ink">{draft.name || "Unnamed PG"}</p>
        <p>
          {draft.pgType ? PG_TYPE_LABEL[draft.pgType] : "Type not set"} · For {PREFERRED_TENANTS_LABEL[draft.preferredTenants].toLowerCase()}
        </p>
        {draft.description ? <p className="line-clamp-3 text-muted-foreground">{draft.description}</p> : null}
      </Section>

      <Section title="Location" step={1} onEdit={onEdit}>
        <p className="font-medium text-ink">{area && city ? `${area.name}, ${city.name}` : "Not set"}</p>
        <p className="text-muted-foreground">{fullAddress(draft)}</p>
      </Section>

      <Section title="Rooms and rent" step={2} onEdit={onEdit}>
        {enabledRooms(draft).map((room) => (
          <p key={room.sharingType}>
            <span className="font-medium text-ink">{SHARING_LABEL[room.sharingType]}</span>:{" "}
            {formatInr(toInt(room.rent) ?? 0)}/bed · deposit {formatInr(toInt(room.deposit) ?? 0)} ·{" "}
            {toInt(room.availableBeds) ?? 0} beds free
          </p>
        ))}
      </Section>

      <Section title="Charges and food" step={3} onEdit={onEdit}>
        <p>Maintenance: {toInt(draft.maintenanceCharge) ? `${formatInr(toInt(draft.maintenanceCharge)!)}/month` : "None"}</p>
        <p>Electricity: {electricityNote(draft)}</p>
        <p>
          Food:{" "}
          {draft.foodIncluded
            ? `${draft.meals.map((m) => MEAL_LABEL[m]).join(", ")} (${[
                draft.vegetarianFood && "veg",
                draft.nonVegetarianFood && "non-veg",
              ]
                .filter(Boolean)
                .join(" & ") || "menu not set"})`
            : "Not included"}
        </p>
        <p>
          Notice: {toInt(draft.noticePeriodDays) ? `${draft.noticePeriodDays} days` : "None"}
          {toInt(draft.lockInMonths) ? ` · Lock-in ${draft.lockInMonths} months` : ""}
        </p>
        {draft.moveInFrom ? <p>Available from {draft.moveInFrom}</p> : null}
      </Section>

      <Section title="Amenities and rules" step={4} onEdit={onEdit}>
        <p>{amenityNames.length ? amenityNames.join(", ") : "No amenities selected"}</p>
        {draft.otherAmenities ? <p>Also: {draft.otherAmenities}</p> : null}
        <p className="text-muted-foreground">
          {rules.join(" · ")} · Gate closes: {formatGateTime(draft.gateClosingTime)}
        </p>
      </Section>

      <Section title="Photos" step={5} onEdit={onEdit}>
        <p>{draft.photos.length} photos added</p>
      </Section>

      <section className="space-y-4 rounded-[18px] border border-border bg-white p-4">
        <h3 className="font-semibold text-ink">Contact for tenants</h3>
        <p className="-mt-2 text-xs text-muted-foreground">
          Leave empty to use your own verified number. Add a manager or caretaker if they handle visits.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" optional htmlFor="contact-name">
            <input
              id="contact-name"
              className={textInputClass}
              value={draft.contactName}
              maxLength={80}
              onChange={(e) => update({ contactName: e.target.value })}
            />
          </Field>
          <Field label="Contact mobile" optional error={errors.contactPhone} htmlFor="contact-phone">
            <input
              id="contact-phone"
              type="tel"
              inputMode="numeric"
              className={textInputClass}
              value={draft.contactPhone}
              maxLength={10}
              onChange={(e) => update({ contactPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
