"use client";

import { BedDouble, BedSingle, Users } from "lucide-react";
import { SHARING_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BEDS_PER_ROOM, toInt, totalBedsFor, type RoomDraft } from "./draft";
import { Field, NumberInput, Stepper } from "./fields";
import type { StepProps } from "./step-basics";

function RoomIcon({ sharing }: { sharing: RoomDraft["sharingType"] }) {
  if (sharing === "SINGLE") return <BedSingle className="h-5 w-5" />;
  if (sharing === "DOUBLE") return <BedDouble className="h-5 w-5" />;
  return <Users className="h-5 w-5" />;
}

export function StepRooms({ draft, update, errors }: StepProps) {
  function setRoom(index: number, patch: Partial<RoomDraft>) {
    update({ rooms: draft.rooms.map((room, i) => (i === index ? { ...room, ...patch } : room)) });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Turn on every sharing type you offer and enter the rent per bed.
      </p>
      {errors.rooms ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.rooms}
        </p>
      ) : null}
      {draft.rooms.map((room, index) => {
        const key = room.sharingType;
        const totalBeds = totalBedsFor(room);
        const roomCount = toInt(room.roomCount) ?? 0;
        const available = toInt(room.availableBeds) ?? 0;
        return (
          <div
            key={key}
            className={cn(
              "rounded-[18px] border bg-white transition-colors",
              room.enabled ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            <button
              type="button"
              role="switch"
              aria-checked={room.enabled}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
              onClick={() =>
                setRoom(index, {
                  enabled: !room.enabled,
                  roomCount: !room.enabled && !room.roomCount ? "1" : room.roomCount,
                })
              }
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-ink">
                <RoomIcon sharing={key} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{SHARING_LABEL[key]}</span>
                <span className="block text-xs text-muted-foreground">
                  {BEDS_PER_ROOM[key]} {BEDS_PER_ROOM[key] === 1 ? "bed" : "beds"} per room
                </span>
              </span>
              <span
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                  room.enabled ? "bg-primary" : "bg-slate-200",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    room.enabled ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>

            {room.enabled ? (
              <div className="grid gap-4 border-t border-border px-4 pb-4 pt-4 sm:grid-cols-2">
                <Field label="Rent per bed" hint="Per month" error={errors[`${key}.rent`]}>
                  <NumberInput
                    prefix="₹"
                    value={room.rent}
                    placeholder="e.g. 9500"
                    invalid={Boolean(errors[`${key}.rent`])}
                    onChange={(rent) => setRoom(index, { rent })}
                  />
                </Field>
                <Field label="Security deposit" hint="One-time, refundable">
                  <NumberInput
                    prefix="₹"
                    value={room.deposit}
                    placeholder="e.g. 10000"
                    onChange={(deposit) => setRoom(index, { deposit })}
                  />
                </Field>
                <Field label="Number of rooms" error={errors[`${key}.roomCount`]}>
                  <Stepper
                    label="rooms"
                    value={roomCount}
                    min={0}
                    max={200}
                    onChange={(n) =>
                      setRoom(index, {
                        roomCount: String(n),
                        availableBeds: String(Math.min(available, n * BEDS_PER_ROOM[key])),
                      })
                    }
                  />
                </Field>
                <Field
                  label="Beds available now"
                  hint={`Out of ${totalBeds} total`}
                  error={errors[`${key}.availableBeds`]}
                >
                  <Stepper
                    label="available beds"
                    value={available}
                    min={0}
                    max={Math.max(totalBeds, 0)}
                    onChange={(n) => setRoom(index, { availableBeds: String(n) })}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
