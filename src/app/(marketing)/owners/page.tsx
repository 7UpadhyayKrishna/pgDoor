import Link from "next/link";
import type { Metadata } from "next";
import { BedDouble, ClipboardList, MessageCircle, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerLaunchLanding } from "@/components/home/owner-launch-landing";
import { LAUNCH_DATE_LABEL } from "@/lib/launch";
import { isPrelaunchForViewer } from "@/lib/launch-server";

const benefits = [
  {
    icon: Route,
    title: "Tenants who actually commute to you",
    body: "pgDoor ranks PGs by travel time to the tenant's office or college, so your listing reaches people who work or study nearby.",
  },
  {
    icon: MessageCircle,
    title: "OTP-verified enquiries",
    body: "Every enquiry comes from a verified mobile number with a move-in window and budget, so you spend less time on time-wasters.",
  },
  {
    icon: BedDouble,
    title: "Fill beds faster",
    body: "Mark beds free from your dashboard. Tenants who asked to be notified get an alert the moment a bed opens.",
  },
  {
    icon: ClipboardList,
    title: "One dashboard",
    body: "Manage rooms, rent, deposits, photos, enquiries and visit requests in one place, on your phone.",
  },
];

const steps = [
  { n: "01", title: "List in about 5 minutes", body: "Add location, rooms and rent, food, rules, amenities and photos." },
  { n: "02", title: "We review it", body: "Our team checks the listing before it goes live, and can verify the property on a visit." },
  { n: "03", title: "Get enquiries", body: "Reply to tenants, confirm visits and keep availability current from the dashboard." },
];

export async function generateMetadata(): Promise<Metadata> {
  if (await isPrelaunchForViewer()) {
    return {
      title: { absolute: "List your PG for free · pgDoor" },
      description: `List your PG on pgDoor for free. No commission, no brokerage. Tenants start searching on ${LAUNCH_DATE_LABEL}.`,
    };
  }
  return {
    title: "List your PG for free",
    description: "List your PG on pgDoor for free. No commission, no brokerage. Get OTP-verified enquiries from tenants who commute nearby.",
  };
}

export default async function OwnersLandingPage() {
  if (await isPrelaunchForViewer()) return <OwnerLaunchLanding />;
  return (
    <div className="container-pg py-12">
      <div className="rounded-[24px] bg-primary-soft px-6 py-12 md:px-12">
        <h1 className="max-w-xl text-4xl font-bold text-ink">Fill your PG beds with tenants who commute nearby</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          List your PG on pgDoor for free. No commission, no brokerage, no lock-in.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/owners/register">List your PG free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login?next=/owners/dashboard">Owner login</Link>
          </Button>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-ink">Why owners use pgDoor</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-[18px] bg-white p-5 shadow-card">
              <item.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
              <p className="mt-3 font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-ink">How listing works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="rounded-[18px] bg-white p-5 shadow-card">
              <p className="text-sm font-bold text-primary">{step.n}</p>
              <p className="mt-1 text-lg font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mt-12 max-w-3xl scroll-mt-24 rounded-[18px] bg-white px-5 py-6 shadow-card">
        <h2 className="text-xl font-semibold text-ink">Pricing</h2>
        <p className="mt-1 text-3xl font-bold text-ink">₹0</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-ink/80 sm:text-base">
          <li>Listing your PG is free.</li>
          <li>No commission on rent and no brokerage from you or your tenants.</li>
          <li>Unlimited enquiries and visit requests.</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          If we introduce paid extras later, we&apos;ll tell you first. Free listings stay free.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/owners/register">Get started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
