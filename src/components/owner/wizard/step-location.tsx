"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Link2, Loader2, MapPin } from "lucide-react";
import { LocationAutocomplete, type SelectedPlace } from "@/components/owner/location-autocomplete";
import { Button } from "@/components/ui/button";
import { isShortMapLink, parseCoordinates, type LatLng } from "@/lib/map-link";
import { resolveCityAndArea } from "@/lib/place-resolve";
import { Field, textInputClass } from "./fields";
import type { StepProps } from "./step-basics";

const PinPicker = dynamic(() => import("@/components/owner/pin-picker").then((m) => m.PinPicker), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-canvas sm:h-72" />,
});

export type WizardCity = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  areas: { id: string; name: string; latitude: number | null; longitude: number | null }[];
};

const NCR_CENTER: LatLng = { latitude: 28.6139, longitude: 77.209 };

export function StepLocation({ draft, update, errors, cities }: StepProps & { cities: WizardCity[] }) {
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [locating, setLocating] = useState(false);
  /** Last address we filled in automatically; a typed address is never overwritten. */
  const autoAddress = useRef(draft.placeAddress);
  const currentAddress = useRef(draft.placeAddress);
  currentAddress.current = draft.placeAddress;
  const pinRequest = useRef(0);

  const city = cities.find((c) => c.id === draft.cityId);
  const area = city?.areas.find((a) => a.id === draft.areaId);
  const pin = draft.latitude != null && draft.longitude != null ? { latitude: draft.latitude, longitude: draft.longitude } : null;
  const mapCenter =
    city?.latitude != null && city.longitude != null ? { latitude: city.latitude, longitude: city.longitude } : NCR_CENTER;

  function onPlaceSelect(place: SelectedPlace) {
    const resolved = resolveCityAndArea(cities, place);
    autoAddress.current = place.address;
    update({
      placeAddress: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      cityId: resolved.cityId,
      areaId: resolved.areaId,
    });
  }

  /** Manual pin (map tap, drag, pasted link): set it now, then fill the address in the background. */
  async function setPin(point: LatLng) {
    const request = ++pinRequest.current;
    const guess = resolveCityAndArea(cities, { ...point, cityName: null, areaName: null });
    update({ latitude: point.latitude, longitude: point.longitude, cityId: guess.cityId, areaId: guess.areaId });

    try {
      const res = await fetch(`/api/places/reverse?lat=${point.latitude}&lng=${point.longitude}`);
      const data = await res.json();
      if (request !== pinRequest.current || !res.ok || !data.place) return;
      const place = data.place as SelectedPlace;
      const resolved = resolveCityAndArea(cities, { ...place, ...point });
      const patch: Partial<typeof draft> = { cityId: resolved.cityId, areaId: resolved.areaId };
      if (!currentAddress.current || currentAddress.current === autoAddress.current) {
        patch.placeAddress = place.address;
        autoAddress.current = place.address;
      }
      update(patch);
    } catch {
      // The pin is already set; the address can be typed by hand.
    }
  }

  async function applyLink() {
    setLinkError("");
    const text = link.trim();
    if (!text) return;
    let point = parseCoordinates(text);
    if (!point && isShortMapLink(text)) {
      setLocating(true);
      try {
        const res = await fetch("/api/places/resolve-link", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: text }),
        });
        const data = await res.json();
        if (res.ok) point = data as LatLng;
        else setLinkError(data.error ?? "Couldn't read that link");
      } catch {
        setLinkError("Couldn't read that link. Check your internet connection.");
      } finally {
        setLocating(false);
      }
      if (!point) return;
    }
    if (!point) {
      setLinkError('Paste a Google Maps link or coordinates like "28.6270, 77.3649"');
      return;
    }
    setLink("");
    await setPin(point);
  }

  return (
    <div className="space-y-6">
      <div>
        <LocationAutocomplete value={draft.placeAddress} onSelect={onPlaceSelect} />
        <p className="mt-1 text-xs text-muted-foreground">
          Search your society, street or a nearby landmark. If it doesn&apos;t show up, use the map or a Google Maps
          link below.
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

      <Field
        label="Google Maps link or coordinates"
        optional
        hint="In Google Maps, long-press your PG, then copy the coordinates or tap Share and copy the link."
        htmlFor="map-link"
      >
        <div className="flex gap-2">
          <input
            id="map-link"
            className={textInputClass}
            value={link}
            placeholder="https://maps.app.goo.gl/… or 28.6270, 77.3649"
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void applyLink();
              }
            }}
          />
          <Button type="button" variant="outline" className="h-12 shrink-0" onClick={applyLink} disabled={locating}>
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Use
          </Button>
        </div>
        {linkError ? <p className="mt-1.5 text-sm text-destructive">{linkError}</p> : null}
      </Field>

      <div className="overflow-hidden rounded-[18px] border border-border bg-white">
        <PinPicker value={pin} fallbackCenter={mapCenter} onChange={setPin} />
        <div className="flex items-start gap-2 p-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="min-w-0 text-muted-foreground">
            {pin ? (
              <>
                <span className="font-medium text-ink">
                  {area && city ? `${area.name}, ${city.name}` : "Location outside supported cities"}
                </span>{" "}
                · Drag the pin to your PG&apos;s gate if it&apos;s slightly off.
              </>
            ) : (
              "Tap the map to drop a pin on your PG."
            )}
          </p>
        </div>
      </div>

      <Field label="Full address" hint="Shown to tenants. Filled in automatically; edit it if needed." htmlFor="place-address">
        <input
          id="place-address"
          className={textInputClass}
          value={draft.placeAddress}
          maxLength={300}
          autoComplete="street-address"
          placeholder="e.g. Sector 62, Noida, Uttar Pradesh 201309"
          onChange={(e) => update({ placeAddress: e.target.value })}
        />
      </Field>

      {pin && cities.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city-select">
            <select
              id="city-select"
              className={textInputClass}
              value={draft.cityId}
              onChange={(e) => {
                const next = cities.find((c) => c.id === e.target.value);
                update({ cityId: e.target.value, areaId: next?.areas[0]?.id ?? "" });
              }}
            >
              <option value="">Choose city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Area" htmlFor="area-select">
            <select
              id="area-select"
              className={textInputClass}
              value={draft.areaId}
              disabled={!city}
              onChange={(e) => update({ areaId: e.target.value })}
            >
              <option value="">Choose area</option>
              {city?.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
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
