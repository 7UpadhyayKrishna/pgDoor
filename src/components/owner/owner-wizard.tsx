"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete, type SelectedPlace } from "@/components/owner/location-autocomplete";
import { resolveCityAndArea } from "@/lib/place-resolve";

type City = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  areas: { id: string; name: string; latitude: number | null; longitude: number | null }[];
};

type Amenity = { slug: string; name: string; group: string };

const SHARING = ["SINGLE", "DOUBLE", "TRIPLE", "FOUR"] as const;

export function OwnerWizard({
  cities,
  amenities,
}: {
  cities: City[];
  amenities: Amenity[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cityId, setCityId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pgType, setPgType] = useState("UNISEX");
  const [foodIncluded, setFoodIncluded] = useState(true);
  const [maintenanceCharge, setMaintenanceCharge] = useState("500");
  const [electricityNote, setElectricityNote] = useState("Actual");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["wifi", "ac"]);
  const [otherEnabled, setOtherEnabled] = useState(false);
  const [otherAmenities, setOtherAmenities] = useState("");
  const [rooms, setRooms] = useState(
    SHARING.map((sharingType) => ({
      sharingType,
      enabled: sharingType === "DOUBLE",
      rent: sharingType === "SINGLE" ? 15000 : sharingType === "DOUBLE" ? 10500 : sharingType === "TRIPLE" ? 8500 : 7000,
      deposit: 10000,
      roomCount: sharingType === "DOUBLE" ? 4 : 0,
      availableBeds: sharingType === "DOUBLE" ? 2 : 0,
    })),
  );

  const locationSelected = Boolean(address && cityId && areaId && latitude != null && longitude != null);

  function onPlaceSelect(place: SelectedPlace) {
    const resolved = resolveCityAndArea(cities, place);
    setAddress(place.address);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setCityId(resolved.cityId);
    setAreaId(resolved.areaId);
    if (!resolved.cityId || !resolved.areaId) {
      setError("We could not map this location to a supported NCR city. Try another nearby place.");
    } else {
      setError("");
    }
  }

  async function publish() {
    if (!locationSelected || latitude == null || longitude == null) {
      setError("Select a location from the suggestions");
      return;
    }
    if (otherEnabled && !otherAmenities.trim()) {
      setError("Describe the additional amenities, or uncheck Other");
      return;
    }
    setLoading(true);
    setError("");
    const payload = {
      name,
      address,
      cityId,
      areaId,
      latitude,
      longitude,
      pgType,
      foodIncluded,
      maintenanceCharge: Number(maintenanceCharge) || undefined,
      electricityNote,
      amenitySlugs: selectedAmenities,
      otherAmenities: otherEnabled ? otherAmenities.trim() : undefined,
      rooms: rooms
        .filter((r) => r.enabled && r.roomCount > 0)
        .map(({ sharingType, rent, deposit, roomCount, availableBeds }) => ({
          sharingType,
          rent,
          deposit,
          roomCount,
          availableBeds,
        })),
      photoUrls: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
      ],
    };
    const res = await fetch("/api/owners/properties", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not publish listing");
      return;
    }
    router.push("/owners/properties");
    router.refresh();
  }

  const steps = ["Property", "Rooms", "Pricing", "Amenities"];

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {steps.length} · {steps[step]}
      </p>
      {step === 0 ? (
        <div className="mt-4 space-y-3">
          <div>
            <Label>PG name</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <LocationAutocomplete value={address} onSelect={onPlaceSelect} />
          {address && cityId ? (
            <p className="text-xs text-muted-foreground">
              Mapped to{" "}
              {cities.find((c) => c.id === cityId)?.areas.find((a) => a.id === areaId)?.name ?? "area"},{" "}
              {cities.find((c) => c.id === cityId)?.name}
            </p>
          ) : null}
          <div>
            <Label>PG type</Label>
            <select
              className="mt-1 h-11 w-full rounded-xl border px-3 text-sm"
              value={pgType}
              onChange={(e) => setPgType(e.target.value)}
            >
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
              <option value="CO_LIVING">Co-living</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="mt-4 space-y-4">
          {rooms.map((room, i) => (
            <div key={room.sharingType} className="rounded-xl border p-3">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={room.enabled}
                  onChange={(e) => {
                    const next = [...rooms];
                    next[i] = { ...room, enabled: e.target.checked, roomCount: e.target.checked ? 2 : 0 };
                    setRooms(next);
                  }}
                />
                {room.sharingType}
              </label>
              {room.enabled ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={room.roomCount}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[i] = { ...room, roomCount: Number(e.target.value) };
                      setRooms(next);
                    }}
                    placeholder="Rooms"
                  />
                  <Input
                    type="number"
                    value={room.availableBeds}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[i] = { ...room, availableBeds: Number(e.target.value) };
                      setRooms(next);
                    }}
                    placeholder="Available beds"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {step === 2 ? (
        <div className="mt-4 space-y-3">
          {rooms
            .filter((r) => r.enabled)
            .map((room) => (
              <div key={room.sharingType} className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{room.sharingType} rent</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={room.rent}
                    onChange={(e) => {
                      setRooms(
                        rooms.map((r) =>
                          r.sharingType === room.sharingType
                            ? { ...r, rent: Number(e.target.value) }
                            : r,
                        ),
                      );
                    }}
                  />
                </div>
                <div>
                  <Label>Deposit</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={room.deposit}
                    onChange={(e) => {
                      setRooms(
                        rooms.map((r) =>
                          r.sharingType === room.sharingType
                            ? { ...r, deposit: Number(e.target.value) }
                            : r,
                        ),
                      );
                    }}
                  />
                </div>
              </div>
            ))}
          <div>
            <Label>Maintenance</Label>
            <Input className="mt-1" value={maintenanceCharge} onChange={(e) => setMaintenanceCharge(e.target.value)} />
          </div>
          <div>
            <Label>Electricity</Label>
            <Input className="mt-1" value={electricityNote} onChange={(e) => setElectricityNote(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={foodIncluded} onChange={(e) => setFoodIncluded(e.target.checked)} />
            Food included
          </label>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {amenities.map((a) => (
              <label key={a.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(a.slug)}
                  onChange={() =>
                    setSelectedAmenities((curr) =>
                      curr.includes(a.slug) ? curr.filter((s) => s !== a.slug) : [...curr, a.slug],
                    )
                  }
                />
                {a.name}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={otherEnabled}
                onChange={(e) => {
                  setOtherEnabled(e.target.checked);
                  if (!e.target.checked) setOtherAmenities("");
                }}
              />
              Other
            </label>
          </div>
          {otherEnabled ? (
            <div>
              <Label>Other amenities</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Study table, balcony, RO water"
                value={otherAmenities}
                onChange={(e) => setOtherAmenities(e.target.value)}
                maxLength={500}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => {
              if (step === 0 && !locationSelected) {
                setError("Select a location from the suggestions");
                return;
              }
              setError("");
              setStep((s) => s + 1);
            }}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={publish} disabled={loading || name.length < 3 || !locationSelected}>
            Publish listing
          </Button>
        )}
      </div>
    </div>
  );
}
