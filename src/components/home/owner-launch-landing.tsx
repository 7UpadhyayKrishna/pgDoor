import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Camera,
  CalendarClock,
  ClipboardList,
  IndianRupee,
  MessageCircle,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAUNCH_DATE_LABEL, LAUNCH_DATE_SHORT } from "@/lib/launch";

const benefits = [
  {
    icon: IndianRupee,
    title: "Free to list",
    body: "No listing fee, no commission and no brokerage. Tenants contact you directly.",
  },
  {
    icon: Star,
    title: "Featured at launch",
    body: `PGs listed before ${LAUNCH_DATE_SHORT} get a featured spot when tenants start searching.`,
  },
  {
    icon: MessageCircle,
    title: "Genuine enquiries",
    body: "Every tenant verifies their phone number, so you only hear from real people.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    body: "Our team reviews each listing. Verified PGs rank higher and get more trust.",
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: "Add your PG details",
    body: "Rooms, rent, deposit, food, rules and amenities. Most owners finish in about 5 minutes.",
  },
  {
    icon: Camera,
    title: "Upload photos",
    body: "Take photos straight from your phone. Tenants trust listings with real photos.",
  },
  {
    icon: Smartphone,
    title: "Verify your phone",
    body: "One OTP at the end and your listing is submitted for review. No password needed.",
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. Listing your PG on pgDoor is free. There is no commission on bookings and no brokerage for you or your tenants.",
  },
  {
    q: "When will tenants see my PG?",
    a: `pgDoor opens to tenants on ${LAUNCH_DATE_LABEL}. Until then we are onboarding owners, so your PG is ready and visible from day one.`,
  },
  {
    q: "How long does the review take?",
    a: "Our team reviews every listing before launch. We check the location, photos and pricing so tenants can trust what they see.",
  },
  {
    q: "Can I edit my listing later?",
    a: "Yes. Log in with your phone number anytime to update rent, available beds, photos or rules.",
  },
  {
    q: "Which cities are supported?",
    a: "We are starting with Delhi NCR: Gurgaon, Noida, Greater Noida and Delhi.",
  },
];

export function OwnerLaunchLanding() {
  return (
    <div className="pb-20 md:pb-0">
      <section className="bg-white">
        <div className="container-pg grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-ink">
              <CalendarClock className="h-4 w-4 text-primary" />
              Tenants start searching {LAUNCH_DATE_SHORT}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">
              List your PG on pgDoor, <span className="text-primary">free</span>.
            </h1>
            <p className="mt-3 max-w-lg text-base text-ink/70 md:text-lg">
              Get your PG ready before launch. Add rooms, rent and photos from your phone and start
              getting direct tenant enquiries from day one.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/owners/register">List your PG for free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login?next=/owners/dashboard">I already listed, log in</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No commission · No brokerage · Takes about 5 minutes
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-card ring-1 ring-border">
              <div className="relative aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
                  alt="Example PG room"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 448px"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Featured
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-ink">Your PG name</p>
                <p className="text-sm text-muted-foreground">Sector 45, Gurgaon · Boys PG</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-ink">
                    ₹9,500 <span className="text-sm font-normal text-muted-foreground">/ bed</span>
                  </p>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-ink">
                    4 beds available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-pg py-12">
        <h2 className="text-2xl font-bold text-ink">Why list on pgDoor now?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-[18px] bg-white p-5 shadow-card">
              <item.icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
              <p className="mt-3 font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-pg py-6">
        <h2 className="text-2xl font-bold text-ink">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-[18px] bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-ink/60" strokeWidth={1.8} />
              </div>
              <p className="mt-3 text-lg font-semibold text-ink">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-pg py-12">
        <h2 className="text-2xl font-bold text-ink">Questions owners ask</h2>
        <div className="mt-6 max-w-3xl divide-y divide-border rounded-[18px] bg-white shadow-card">
          {faqs.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {item.q}
                <span className="text-xl leading-none text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-ink/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-pg pb-12">
        <div className="rounded-[24px] bg-primary-soft px-6 py-10 md:px-12">
          <h2 className="text-3xl font-bold text-ink">Be ready before tenants arrive.</h2>
          <p className="mt-2 max-w-xl text-ink/70">
            Owners who list early get featured on launch day, {LAUNCH_DATE_LABEL}.
          </p>
          <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
            <Link href="/owners/register">List your PG for free</Link>
          </Button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white p-3 md:hidden">
        <Button asChild size="lg" className="w-full">
          <Link href="/owners/register">List your PG for free</Link>
        </Button>
      </div>
    </div>
  );
}
