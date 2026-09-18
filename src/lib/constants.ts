export const SESSION_COOKIE = "pgdoor_session";
export const SESSION_TTL_DAYS = 30;

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_PER_WINDOW = 3;
export const OTP_WINDOW_MINUTES = 10;

export const COMPARE_LIMIT = 3;
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
  { label: "Near me", href: "/pgs/gurgaon" },
  { label: "Under ₹10K", href: "/pgs?budgetMax=10000" },
  { label: "Single room", href: "/pgs?sharing=SINGLE" },
  { label: "Boys PG", href: "/pgs?pgType=BOYS" },
  { label: "Girls PG", href: "/pgs?pgType=GIRLS" },
  { label: "With food", href: "/pgs?food=true" },
];

export const NAV = {
  desktop: [
    { label: "Find PGs", href: "/pgs" },
    { label: "Explore", href: "/pgs/gurgaon" },
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
