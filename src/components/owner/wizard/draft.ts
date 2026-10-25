export const SHARING_TYPES = ["SINGLE", "DOUBLE", "TRIPLE", "FOUR"] as const;
export type SharingType = (typeof SHARING_TYPES)[number];

export const BEDS_PER_ROOM: Record<SharingType, number> = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  FOUR: 4,
};

export const MEALS = ["BREAKFAST", "LUNCH", "DINNER"] as const;
export type Meal = (typeof MEALS)[number];

export type ElectricityMode = "INCLUDED" | "METER" | "FIXED";

export type RoomDraft = {
  sharingType: SharingType;
  enabled: boolean;
  rent: string;
  deposit: string;
  roomCount: string;
  availableBeds: string;
};

export type ListingDraft = {
  name: string;
  pgType: "" | "BOYS" | "GIRLS" | "CO_LIVING" | "UNISEX";
  preferredTenants: "ANY" | "STUDENTS" | "PROFESSIONALS";
  description: string;
  placeAddress: string;
  addressLine: string;
  cityId: string;
  areaId: string;
  latitude: number | null;
  longitude: number | null;
  rooms: RoomDraft[];
  maintenanceCharge: string;
  electricity: ElectricityMode;
  electricityAmount: string;
  foodIncluded: boolean;
  meals: Meal[];
  vegetarianFood: boolean;
  nonVegetarianFood: boolean;
  noticePeriodDays: string;
  lockInMonths: string;
  moveInFrom: string;
  amenitySlugs: string[];
  otherAmenities: string;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  visitorsAllowed: boolean;
  cookingAllowed: boolean;
  gateClosingTime: string;
  contactName: string;
  contactPhone: string;
  photos: string[];
};

export function emptyDraft(): ListingDraft {
  return {
    name: "",
    pgType: "",
    preferredTenants: "ANY",
    description: "",
    placeAddress: "",
    addressLine: "",
    cityId: "",
    areaId: "",
    latitude: null,
    longitude: null,
    rooms: SHARING_TYPES.map((sharingType) => ({
      sharingType,
      enabled: false,
      rent: "",
      deposit: "",
      roomCount: "",
      availableBeds: "",
    })),
    maintenanceCharge: "",
    electricity: "METER",
    electricityAmount: "",
    foodIncluded: false,
    meals: [],
    vegetarianFood: true,
    nonVegetarianFood: false,
    noticePeriodDays: "30",
    lockInMonths: "",
    moveInFrom: "",
    amenitySlugs: ["wifi", "bed", "mattress"],
    otherAmenities: "",
    smokingAllowed: false,
    alcoholAllowed: false,
    visitorsAllowed: true,
    cookingAllowed: false,
    gateClosingTime: "",
    contactName: "",
    contactPhone: "",
    photos: [],
  };
}

export function toInt(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
}

export function fullAddress(draft: ListingDraft) {
  const line = draft.addressLine.trim();
  return line ? `${line}, ${draft.placeAddress}` : draft.placeAddress;
}

export function electricityNote(draft: ListingDraft) {
  const amount = toInt(draft.electricityAmount);
  if (draft.electricity === "INCLUDED") return "Included in rent";
  if (draft.electricity === "FIXED") return amount ? `Fixed ₹${amount}/month` : "Fixed monthly";
  return amount ? `As per meter (₹${amount}/unit)` : "As per meter";
}

export function parseElectricityNote(note: string | null): Pick<ListingDraft, "electricity" | "electricityAmount"> {
  if (!note) return { electricity: "METER", electricityAmount: "" };
  const amount = note.match(/₹\s?(\d+)/)?.[1] ?? "";
  if (/included/i.test(note)) return { electricity: "INCLUDED", electricityAmount: "" };
  if (/fixed/i.test(note)) return { electricity: "FIXED", electricityAmount: amount };
  return { electricity: "METER", electricityAmount: amount };
}

export function enabledRooms(draft: ListingDraft) {
  return draft.rooms.filter((room) => room.enabled);
}

export function totalBedsFor(room: RoomDraft) {
  return (toInt(room.roomCount) ?? 0) * BEDS_PER_ROOM[room.sharingType];
}

export type StepErrors = Record<string, string>;

export function validateStep(step: number, draft: ListingDraft): StepErrors {
  const errors: StepErrors = {};
  if (step === 0) {
    if (draft.name.trim().length < 3) errors.name = "Enter your PG name (at least 3 characters)";
    if (!draft.pgType) errors.pgType = "Choose who the PG is for";
  }
  if (step === 1) {
    if (!draft.placeAddress || draft.latitude == null || draft.longitude == null) {
      errors.location = "Search and pick your PG location from the suggestions";
    } else if (!draft.cityId || !draft.areaId) {
      errors.location = "This location is outside the cities we support right now (Delhi NCR)";
    }
  }
  if (step === 2) {
    const rooms = enabledRooms(draft);
    if (!rooms.length) errors.rooms = "Turn on at least one room type";
    for (const room of rooms) {
      const key = room.sharingType;
      if (!toInt(room.rent)) errors[`${key}.rent`] = "Enter monthly rent";
      if (!toInt(room.roomCount)) errors[`${key}.roomCount`] = "How many rooms?";
      const available = toInt(room.availableBeds) ?? 0;
      if (available > totalBedsFor(room)) {
        errors[`${key}.availableBeds`] = `Can't be more than ${totalBedsFor(room)} beds`;
      }
    }
  }
  if (step === 3) {
    if (draft.foodIncluded && !draft.meals.length) errors.meals = "Pick the meals you serve";
    if ((toInt(draft.noticePeriodDays) ?? 0) > 180) errors.noticePeriodDays = "Max 180 days";
    if ((toInt(draft.lockInMonths) ?? 0) > 24) errors.lockInMonths = "Max 24 months";
  }
  if (step === 5) {
    if (!draft.photos.length) errors.photos = "Add at least one photo of your PG";
  }
  if (step === 6) {
    const phone = draft.contactPhone.replace(/\D/g, "");
    if (phone && !/^[6-9]\d{9}$/.test(phone)) errors.contactPhone = "Enter a valid 10-digit mobile number";
  }
  return errors;
}

export function draftToPayload(draft: ListingDraft) {
  const phone = draft.contactPhone.replace(/\D/g, "");
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    address: fullAddress(draft),
    cityId: draft.cityId,
    areaId: draft.areaId,
    latitude: draft.latitude,
    longitude: draft.longitude,
    pgType: draft.pgType,
    preferredTenants: draft.preferredTenants,
    foodIncluded: draft.foodIncluded,
    mealsProvided: draft.foodIncluded ? draft.meals : [],
    vegetarianFood: draft.vegetarianFood,
    nonVegetarianFood: draft.nonVegetarianFood,
    maintenanceCharge: toInt(draft.maintenanceCharge),
    electricityNote: electricityNote(draft),
    smokingAllowed: draft.smokingAllowed,
    alcoholAllowed: draft.alcoholAllowed,
    visitorsAllowed: draft.visitorsAllowed,
    cookingAllowed: draft.cookingAllowed,
    gateClosingTime: draft.gateClosingTime || undefined,
    noticePeriodDays: toInt(draft.noticePeriodDays),
    lockInMonths: toInt(draft.lockInMonths),
    moveInFrom: draft.moveInFrom || undefined,
    contactName: draft.contactName.trim() || undefined,
    contactPhone: phone || undefined,
    amenitySlugs: draft.amenitySlugs,
    otherAmenities: draft.otherAmenities.trim() || undefined,
    rooms: enabledRooms(draft).map((room) => ({
      sharingType: room.sharingType,
      rent: toInt(room.rent) ?? 0,
      deposit: toInt(room.deposit) ?? 0,
      roomCount: toInt(room.roomCount) ?? 0,
      availableBeds: toInt(room.availableBeds) ?? 0,
    })),
    photoUrls: draft.photos,
  };
}

type PropertyForDraft = {
  name: string;
  pgType: "BOYS" | "GIRLS" | "CO_LIVING" | "UNISEX";
  preferredTenants: "ANY" | "STUDENTS" | "PROFESSIONALS";
  description: string | null;
  address: string;
  cityId: string;
  areaId: string;
  latitude: number;
  longitude: number;
  maintenanceCharge: number | null;
  electricityNote: string | null;
  foodIncluded: boolean;
  mealsProvided: string[];
  vegetarianFood: boolean;
  nonVegetarianFood: boolean;
  noticePeriodDays: number | null;
  lockInMonths: number | null;
  moveInFrom: Date | null;
  otherAmenities: string | null;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  visitorsAllowed: boolean;
  cookingAllowed: boolean;
  gateClosingTime: string | null;
  contactName: string | null;
  contactPhone: string | null;
  photos: { url: string }[];
  amenities: { amenity: { slug: string } }[];
  roomTypes: {
    sharingType: SharingType;
    rent: number;
    deposit: number;
    availableBeds: number;
    rooms: { id: string }[];
  }[];
};

const IST_OFFSET_MS = 330 * 60 * 1000;

function istDateString(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function propertyToDraft(property: PropertyForDraft): ListingDraft {
  const base = emptyDraft();
  const str = (n: number | null | undefined) => (n == null ? "" : String(n));
  return {
    ...base,
    name: property.name,
    pgType: property.pgType,
    preferredTenants: property.preferredTenants,
    description: property.description ?? "",
    placeAddress: property.address,
    addressLine: "",
    cityId: property.cityId,
    areaId: property.areaId,
    latitude: property.latitude,
    longitude: property.longitude,
    rooms: base.rooms.map((room) => {
      const existing = property.roomTypes.find((rt) => rt.sharingType === room.sharingType);
      if (!existing) return room;
      return {
        sharingType: room.sharingType,
        enabled: true,
        rent: str(existing.rent),
        deposit: str(existing.deposit),
        roomCount: str(existing.rooms.length),
        availableBeds: str(existing.availableBeds),
      };
    }),
    maintenanceCharge: str(property.maintenanceCharge),
    ...parseElectricityNote(property.electricityNote),
    foodIncluded: property.foodIncluded,
    meals: property.mealsProvided.filter((m): m is Meal => (MEALS as readonly string[]).includes(m)),
    vegetarianFood: property.vegetarianFood,
    nonVegetarianFood: property.nonVegetarianFood,
    noticePeriodDays: str(property.noticePeriodDays),
    lockInMonths: str(property.lockInMonths),
    moveInFrom: property.moveInFrom ? istDateString(property.moveInFrom) : "",
    amenitySlugs: property.amenities.map((row) => row.amenity.slug),
    otherAmenities: property.otherAmenities ?? "",
    smokingAllowed: property.smokingAllowed,
    alcoholAllowed: property.alcoholAllowed,
    visitorsAllowed: property.visitorsAllowed,
    cookingAllowed: property.cookingAllowed,
    gateClosingTime: property.gateClosingTime ?? "",
    contactName: property.contactName ?? "",
    contactPhone: property.contactPhone ?? "",
    photos: property.photos.map((photo) => photo.url),
  };
}

export function completeness(draft: ListingDraft) {
  const checks = [
    draft.name.trim().length >= 3,
    Boolean(draft.pgType),
    draft.description.trim().length >= 40,
    Boolean(draft.cityId && draft.latitude != null),
    enabledRooms(draft).length > 0,
    enabledRooms(draft).every((room) => toInt(room.deposit) != null),
    Boolean(draft.maintenanceCharge || draft.electricity === "INCLUDED"),
    Boolean(draft.noticePeriodDays),
    draft.amenitySlugs.length >= 5,
    Boolean(draft.gateClosingTime),
    draft.photos.length >= 4,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
