"use client";

import { MapPin } from "lucide-react";
import { LocationAutocomplete, type SelectedPlace } from "@/components/owner/location-autocomplete";
import { resolveCityAndArea } from "@/lib/place-resolve";
import { Field, textInputClass } from "./fields";
import type { StepProps } from "./step-basics";

export type WizardCity = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  areas: { id: string; name: string; latitude: number | null; longitude: number | null }[];
};

export function StepLocation({ draft, update, errors, cities }: StepProps & { cities: WizardCity[] }) {
  function onPlaceSelect(place: SelectedPlace) {
    const resolved = resolveCityAndArea(cities, place);
    update({
      placeAddress: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      cityId: resolved.cityId,
      areaId: resolved.areaId,
    });
  }

  const city = cities.find((c) => c.id === draft.cityId);
  const area = city?.areas.find((a) => a.id === draft.areaId);
  const hasPin = draft.latitude != null && draft.longitude != null;

  return (
    <div className="space-y-6">
      <div>
        <LocationAutocomplete value={draft.placeAddress} onSelect={onPlaceSelect} />
        <p className="mt-1 text-xs text-muted-foreground">
          Search your society, street or a nearby landmark and pick it from the list.
        </p>
        {cities.length === 0 ? (
          <p role="alert" className="mt-1.5 text-sm text-destructive">
            We couldn&apos;t load our list of cities. Please refresh the page or try again in a few minutes.
          </p>
        ) : errors.location ? (
          <p role="alert" className="mt-1.5 text-sm text-destructive">
            {errors.location}
          </p>
        ) : null}
      </div>

      {hasPin ? (
        <div className="overflow-hidden rounded-[18px] border border-border bg-white">
          <iframe
            title="PG location preview"
            className="h-52 w-full sm:h-64"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${draft.latitude},${draft.longitude}&z=16&output=embed`}
          />
          <div className="flex items-start gap-2 p-3 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium text-ink">
                {area && city ? `${area.name}, ${city.name}` : "Location outside supported cities"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{draft.placeAddress}</p>
            </div>
          </div>
        </div>
      ) : null}

      <Field
        label="House / building / floor"
        optional
        hint="Helps tenants find your PG on the day of the visit."
        htmlFor="address-line"
      >
        <input
          id="address-line"
          className={textInputClass}
          value={draft.addressLine}
          maxLength={200}
          autoComplete="address-line1"
          placeholder="e.g. H.No 221, 2nd floor, near SBI ATM"
          onChange={(e) => update({ addressLine: e.target.value })}
        />
      </Field>
    </div>
  );
}
