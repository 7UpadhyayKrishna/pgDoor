import type { Metadata } from "next";
import { MarketplaceHome } from "@/components/home/marketplace-home";
import { TenantLaunchHome } from "@/components/home/tenant-launch-home";
import { isPrelaunch, LAUNCH_DATE_LABEL } from "@/lib/launch";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  if (!isPrelaunch()) return {};
  return {
    title: { absolute: "pgDoor — Find your next PG. Launching 1 Jan 2027" },
    description: `Verified PGs with real photos, clear prices and live availability, searchable by commute. pgDoor opens for tenants in Delhi NCR on ${LAUNCH_DATE_LABEL}.`,
  };
}

export default async function HomePage() {
  if (isPrelaunch()) {
    return <TenantLaunchHome />;
  }
  return <MarketplaceHome />;
}
