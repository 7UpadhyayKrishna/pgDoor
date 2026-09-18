import {
  BedStatus,
  type Prisma,
  type RoomSharingType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bedsPerSharing } from "@/lib/utils";

export type RoomSpec = {
  sharingType: RoomSharingType;
  rent: number;
  deposit: number;
  roomCount: number;
  availableBeds: number;
};

function bedLabels(count: number) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

export async function generateFromCounts(
  propertyId: string,
  specs: RoomSpec[],
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  for (const spec of specs) {
    const perRoom = bedsPerSharing(spec.sharingType);
    const totalBeds = spec.roomCount * perRoom;
    const available = Math.min(Math.max(spec.availableBeds, 0), totalBeds);

    const roomType = await client.roomType.upsert({
      where: {
        propertyId_sharingType: {
          propertyId,
          sharingType: spec.sharingType,
        },
      },
      update: {
        rent: spec.rent,
        deposit: spec.deposit,
        totalBeds,
        availableBeds: available,
      },
      create: {
        propertyId,
        sharingType: spec.sharingType,
        rent: spec.rent,
        deposit: spec.deposit,
        totalBeds,
        availableBeds: available,
      },
    });

    await client.bed.deleteMany({
      where: { room: { roomTypeId: roomType.id } },
    });
    await client.room.deleteMany({ where: { roomTypeId: roomType.id } });

    let remainingAvailable = available;
    for (let i = 0; i < spec.roomCount; i += 1) {
      const room = await client.room.create({
        data: {
          propertyId,
          roomTypeId: roomType.id,
          name: `Room ${i + 1}`,
          totalBeds: perRoom,
        },
      });
      const labels = bedLabels(perRoom);
      for (const label of labels) {
        const status: BedStatus =
          remainingAvailable > 0 ? BedStatus.AVAILABLE : BedStatus.OCCUPIED;
        if (status === BedStatus.AVAILABLE) remainingAvailable -= 1;
        await client.bed.create({
          data: { roomId: room.id, label, status },
        });
      }
    }
  }

  return syncDenormalized(propertyId, client);
}

export async function syncDenormalized(
  propertyId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const roomTypes = await client.roomType.findMany({
    where: { propertyId },
    include: {
      rooms: { include: { beds: true } },
    },
  });

  let totalBeds = 0;
  let availableBeds = 0;
  let minRent = Number.POSITIVE_INFINITY;
  let minDeposit = Number.POSITIVE_INFINITY;

  for (const rt of roomTypes) {
    const beds = rt.rooms.flatMap((room) => room.beds);
    const available = beds.filter((bed) => bed.status === "AVAILABLE").length;
    totalBeds += beds.length;
    availableBeds += available;
    if (rt.rent < minRent) minRent = rt.rent;
    if (rt.deposit < minDeposit) minDeposit = rt.deposit;
    await client.roomType.update({
      where: { id: rt.id },
      data: { totalBeds: beds.length, availableBeds: available },
    });
  }

  return client.property.update({
    where: { id: propertyId },
    data: {
      totalBeds,
      availableBeds,
      minRent: Number.isFinite(minRent) ? minRent : 0,
      minDeposit: Number.isFinite(minDeposit) ? minDeposit : 0,
      availabilityUpdatedAt: new Date(),
    },
  });
}

export async function confirmAvailability(propertyId: string) {
  return prisma.property.update({
    where: { id: propertyId },
    data: {
      availabilityConfirmedAt: new Date(),
    },
  });
}

export async function setBedStatus(bedId: string, status: BedStatus) {
  const bed = await prisma.bed.update({
    where: { id: bedId },
    data: { status },
    include: { room: true },
  });
  await syncDenormalized(bed.room.propertyId);
  return bed;
}

export function isStale(confirmedAt: Date, days = 3) {
  return Date.now() - confirmedAt.getTime() > days * 24 * 60 * 60 * 1000;
}
