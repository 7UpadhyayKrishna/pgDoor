"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [areaId, setAreaId] = useState(cities[0]?.areas[0]?.id ?? "");
  const [pgType, setPgType] = useState("UNISEX");
  const [foodIncluded, setFoodIncluded] = useState(true);
  const [maintenanceCharge, setMaintenanceCharge] = useState("500");
  const [electricityNote, setElectricityNote] = useState("Actual");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["wifi", "ac"]);
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

  const city = cities.find((c) => c.id === cityId);
  const area = city?.areas.find((a) => a.id === areaId);

  async function publish() {
    setLoading(true);
    setError("");
    const payload = {
      name,
      address,
      cityId,
      areaId,
      latitude: area?.latitude ?? city?.latitude ?? 28.4595,
      longitude: area?.longitude ?? city?.longitude ?? 77.0266,
      pgType,
      foodIncluded,
      maintenanceCharge: Number(maintenanceCharge) || undefined,
      electricityNote,
      amenitySlugs: selectedAmenities,
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
          <div>
            <Label>Address</Label>
            <Input className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>City</Label>
              <select
                className="mt-1 h-11 w-full rounded-xl border px-3 text-sm"
                value={cityId}
                onChange={(e) => {
                  setCityId(e.target.value);
                  const next = cities.find((c) => c.id === e.target.value);
                  setAreaId(next?.areas[0]?.id ?? "");
                }}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Area</Label>
              <select
                className="mt-1 h-11 w-full rounded-xl border px-3 text-sm"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                {city?.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
        <div className="mt-4 grid grid-cols-2 gap-2">
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
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
        ) : (
          <Button onClick={publish} disabled={loading || name.length < 3}>
            Publish listing
          </Button>
        )}
      </div>
    </div>
  );
}
