export const SESSION_COOKIE = "pgdoor_session";
export const SESSION_TTL_DAYS = 30;

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_PER_WINDOW = 3;
export const OTP_WINDOW_MINUTES = 10;

export const COMPARE_LIMIT = 4;
export const SEARCH_PAGE_SIZE = 12;
export const STALE_AVAILABILITY_DAYS = 3;

export const SHARING_LABEL: Record<string, string> = {
  SINGLE: "Single Sharing",
  DOUBLE: "Double Sharing",
  TRIPLE: "Triple Sharing",
  FOUR: "Four Sharing",
};

export const PG_TYPE_LABEL: Record<string, string> = {
  BOYS: "Boys PG",
  GIRLS: "Girls PG",
  CO_LIVING: "Co-living",
  UNISEX: "Unisex",
};

export const PREFERRED_TENANTS_LABEL: Record<string, string> = {
  ANY: "Anyone",
  STUDENTS: "Students",
  PROFESSIONALS: "Working professionals",
};

export const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

export const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER"];
export const SHARING_ORDER = ["SINGLE", "DOUBLE", "TRIPLE", "FOUR"];

/** Levels where pgDoor has checked the property itself, not just the owner. */
export const PUBLIC_VERIFIED_LEVELS = ["PROPERTY_VERIFIED", "PGDOOR_VERIFIED"];

/** "Breakfast, lunch, dinner" in meal order, whatever order the owner ticked them. */
export function formatMeals(meals: string[]) {
  const sorted = [...meals].sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b));
  const labels = sorted.map((meal) => MEAL_LABEL[meal] ?? meal);
  return labels
    .map((label, i) => (i === 0 ? label : label.toLowerCase()))
    .join(", ");
}

export const MOVE_IN_LABEL: Record<string, string> = {
  IMMEDIATE: "Immediately",
  WITHIN_7_DAYS: "Within 7 days",
  THIS_MONTH: "This month",
  LATER: "Later",
};

export const VERIFICATION_LABEL: Record<string, string> = {
  UNVERIFIED: "Unverified",
  OWNER_VERIFIED: "Owner verified",
  PROPERTY_VERIFIED: "Property verified",
  PGDOOR_VERIFIED: "pgDoor Verified",
};

export const QUICK_CHIPS = [
  {
    label: "Near Cyber City",
    href: "/pgs?destLat=28.4940&destLng=77.0881&destLabel=Cyber%20City&commuteMax=20&mode=metro&budgetMax=15000&sort=true_cost",
  },
  { label: "Under ₹10K", href: "/pgs?budgetMax=10000" },
  { label: "Single room", href: "/pgs?sharing=SINGLE" },
  { label: "Boys PG", href: "/pgs?pgType=BOYS" },
  { label: "Girls PG", href: "/pgs?pgType=GIRLS" },
  { label: "With food", href: "/pgs?food=true" },
];

export const NAV = {
  desktop: [
    { label: "Find PGs", href: "/pgs" },
    { label: "Explore", href: "/pgs?view=map" },
    { label: "For Owners", href: "/owners" },
  ],
  mobile: [
    { label: "Home", href: "/", icon: "home" },
    { label: "Search", href: "/pgs", icon: "search" },
    { label: "Saved", href: "/saved", icon: "heart" },
    { label: "Enquiries", href: "/account/enquiries", icon: "inbox" },
    { label: "Profile", href: "/account", icon: "user" },
  ],
} as const;
