import type { PgType, RoomSharingType, VerificationLevel } from "@prisma/client";

const PHOTO = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export type DemoPg = {
  name: string;
  citySlug: string;
  areaSlug: string;
  pgType: PgType;
  featured: boolean;
  verificationLevel: VerificationLevel;
  foodIncluded: boolean;
  maintenanceCharge: number;
  electricityNote: string;
  ratingAvg: number;
  reviewCount: number;
  description: string;
  address: string;
  amenities: string[];
  photos: string[];
  rooms: {
    sharingType: RoomSharingType;
    rent: number;
    deposit: number;
    roomCount: number;
    availableBeds: number;
  }[];
};

export const DEMO_PGS: DemoPg[] = [
  {
    name: "UrbanNest PG",
    citySlug: "noida",
    areaSlug: "sector-62",
    pgType: "GIRLS",
    featured: true,
    verificationLevel: "PGDOOR_VERIFIED",
    foodIncluded: true,
    maintenanceCharge: 500,
    electricityNote: "Actual",
    ratingAvg: 4.5,
    reviewCount: 182,
    description: "Verified girls PG near the Sector 62 IT hub with meals and housekeeping.",
    address: "Plot 12, Sector 62, Noida",
    amenities: ["ac", "wifi", "food", "laundry", "cctv", "housekeeping", "attached-bathroom", "bed"],
    photos: [
      PHOTO("photo-1522771739844-6a9f6d5f14af"),
      PHOTO("photo-1631049307264-da0ec9d70304"),
      PHOTO("photo-1595526114035-0d45ed16cfbf"),
    ],
    rooms: [
      { sharingType: "SINGLE", rent: 15000, deposit: 15000, roomCount: 4, availableBeds: 1 },
      { sharingType: "DOUBLE", rent: 9500, deposit: 10000, roomCount: 8, availableBeds: 2 },
      { sharingType: "TRIPLE", rent: 8500, deposit: 8000, roomCount: 4, availableBeds: 0 },
    ],
  },
  {
    name: "Neo Living PG",
    citySlug: "gurgaon",
    areaSlug: "sector-44",
    pgType: "CO_LIVING",
    featured: true,
    verificationLevel: "PGDOOR_VERIFIED",
    foodIncluded: true,
    maintenanceCharge: 800,
    electricityNote: "Actual",
    ratingAvg: 4.6,
    reviewCount: 94,
    description: "Co-living near HUDA City Centre with AC rooms, laundry and Wi-Fi.",
    address: "A-21, Sector 44, Gurgaon",
    amenities: ["ac", "wifi", "food", "laundry", "parking", "power-backup", "lift", "cctv"],
    photos: [
      PHOTO("photo-1522708323590-d24dbb6b0267"),
      PHOTO("photo-1502672260266-1c1ef2d93688"),
      PHOTO("photo-1560448204-e02f11c3d0e2"),
    ],
    rooms: [
      { sharingType: "SINGLE", rent: 18000, deposit: 20000, roomCount: 6, availableBeds: 1 },
      { sharingType: "DOUBLE", rent: 12500, deposit: 12000, roomCount: 10, availableBeds: 3 },
    ],
  },
  {
    name: "CyberStay PG",
    citySlug: "gurgaon",
    areaSlug: "dlf-phase-3",
    pgType: "BOYS",
    featured: false,
    verificationLevel: "PROPERTY_VERIFIED",
    foodIncluded: true,
    maintenanceCharge: 400,
    electricityNote: "Actual",
    ratingAvg: 4.2,
    reviewCount: 61,
    description: "Boys PG walking distance from Cyber City offices.",
    address: "House 8, DLF Phase 3, Gurgaon",
    amenities: ["ac", "wifi", "food", "parking", "cctv", "power-backup"],
    photos: [PHOTO("photo-1555854877-bab0e564b8d5"), PHOTO("photo-1540518614846-7eded433c457")],
    rooms: [
      { sharingType: "DOUBLE", rent: 11000, deposit: 10000, roomCount: 8, availableBeds: 4 },
      { sharingType: "TRIPLE", rent: 8000, deposit: 8000, roomCount: 6, availableBeds: 2 },
    ],
  },
  {
    name: "Golf Course Living",
    citySlug: "gurgaon",
    areaSlug: "golf-course-road",
    pgType: "UNISEX",
    featured: true,
    verificationLevel: "OWNER_VERIFIED",
    foodIncluded: false,
    maintenanceCharge: 1000,
    electricityNote: "Included up to 200 units",
    ratingAvg: 4.3,
    reviewCount: 40,
    description: "Premium rooms on Golf Course Road. Cooking allowed in common kitchen.",
    address: "Tower B, Golf Course Road, Gurgaon",
    amenities: ["ac", "wifi", "parking", "lift", "housekeeping", "attached-bathroom", "attached-balcony"],
    photos: [PHOTO("photo-1505693416388-ac5ce068fe85"), PHOTO("photo-1560185127-6a0000411baa")],
    rooms: [{ sharingType: "SINGLE", rent: 22000, deposit: 25000, roomCount: 12, availableBeds: 2 }],
  },
  {
    name: "Yamuna House",
    citySlug: "noida",
    areaSlug: "sector-18",
    pgType: "GIRLS",
    featured: false,
    verificationLevel: "PGDOOR_VERIFIED",
    foodIncluded: true,
    maintenanceCharge: 300,
    electricityNote: "Actual",
    ratingAvg: 4.4,
    reviewCount: 128,
    description: "Girls PG close to Sector 18 market and metro.",
    address: "D-44, Sector 18, Noida",
    amenities: ["wifi", "food", "laundry", "cctv", "housekeeping", "bed", "wardrobe"],
    photos: [PHOTO("photo-1616594039964-ae9021a400a0"), PHOTO("photo-1611892440504-42a792e24d32")],
    rooms: [
      { sharingType: "DOUBLE", rent: 9000, deposit: 9000, roomCount: 7, availableBeds: 1 },
      { sharingType: "TRIPLE", rent: 7500, deposit: 7500, roomCount: 5, availableBeds: 3 },
    ],
  },
  {
    name: "Knowledge Park Stay",
    citySlug: "noida",
    areaSlug: "sector-62",
    pgType: "BOYS",
    featured: false,
    verificationLevel: "UNVERIFIED",
    foodIncluded: true,
    maintenanceCharge: 200,
    electricityNote: "Actual",
    ratingAvg: 3.9,
    reviewCount: 22,
    description: "Budget boys PG for students and early-career professionals.",
    address: "Lane 4, Sector 62, Noida",
    amenities: ["wifi", "food", "laundry", "cctv"],
    photos: [PHOTO("photo-1486304873000-235643847519")],
    rooms: [
      { sharingType: "TRIPLE", rent: 6500, deposit: 6000, roomCount: 6, availableBeds: 5 },
      { sharingType: "FOUR", rent: 5500, deposit: 5000, roomCount: 4, availableBeds: 4 },
    ],
  },
  {
    name: "SouthEx Residency",
    citySlug: "delhi",
    areaSlug: "south-extension",
    pgType: "GIRLS",
    featured: true,
    verificationLevel: "PGDOOR_VERIFIED",
    foodIncluded: true,
    maintenanceCharge: 600,
    electricityNote: "Actual",
    ratingAvg: 4.7,
    reviewCount: 210,
    description: "Quiet girls PG in South Extension with attached baths and meals.",
    address: "E-19, South Extension Part II, Delhi",
    amenities: ["ac", "wifi", "food", "laundry", "housekeeping", "attached-bathroom", "lift", "cctv"],
    photos: [PHOTO("photo-1615874959474-d609969a20ed"), PHOTO("photo-1616593969747-47618aa7c0f5")],
    rooms: [
      { sharingType: "SINGLE", rent: 17000, deposit: 17000, roomCount: 5, availableBeds: 0 },
      { sharingType: "DOUBLE", rent: 12000, deposit: 12000, roomCount: 8, availableBeds: 2 },
    ],
  },
  {
    name: "Connaught Colive",
    citySlug: "delhi",
    areaSlug: "connaught-place",
    pgType: "CO_LIVING",
    featured: false,
    verificationLevel: "PROPERTY_VERIFIED",
    foodIncluded: false,
    maintenanceCharge: 1200,
    electricityNote: "Included",
    ratingAvg: 4.1,
    reviewCount: 33,
    description: "Co-living in central Delhi. Walking distance to CP metro.",
    address: "Block B, Connaught Place, New Delhi",
    amenities: ["ac", "wifi", "parking", "lift", "power-backup", "washing-machine"],
    photos: [PHOTO("photo-1505691938895-1758d7feb511"), PHOTO("photo-1484154218962-a197022b5858")],
    rooms: [
      { sharingType: "SINGLE", rent: 20000, deposit: 20000, roomCount: 8, availableBeds: 2 },
      { sharingType: "DOUBLE", rent: 14000, deposit: 14000, roomCount: 6, availableBeds: 1 },
    ],
  },
];
