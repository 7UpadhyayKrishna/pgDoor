import { AmenityGroup } from "@prisma/client";

export const AMENITIES: { name: string; slug: string; group: AmenityGroup }[] = [
  { name: "AC", slug: "ac", group: "ROOM" },
  { name: "Bed", slug: "bed", group: "ROOM" },
  { name: "Mattress", slug: "mattress", group: "ROOM" },
  { name: "Wardrobe", slug: "wardrobe", group: "ROOM" },
  { name: "Attached bathroom", slug: "attached-bathroom", group: "ROOM" },
  { name: "Attached balcony", slug: "attached-balcony", group: "ROOM" },
  { name: "Wi-Fi", slug: "wifi", group: "PROPERTY" },
  { name: "CCTV", slug: "cctv", group: "PROPERTY" },
  { name: "Lift", slug: "lift", group: "PROPERTY" },
  { name: "Parking", slug: "parking", group: "PROPERTY" },
  { name: "Power backup", slug: "power-backup", group: "PROPERTY" },
  { name: "Washing machine", slug: "washing-machine", group: "PROPERTY" },
  { name: "Food", slug: "food", group: "SERVICES" },
  { name: "Laundry", slug: "laundry", group: "SERVICES" },
  { name: "Housekeeping", slug: "housekeeping", group: "SERVICES" },
  { name: "Maintenance", slug: "maintenance", group: "SERVICES" },
];
