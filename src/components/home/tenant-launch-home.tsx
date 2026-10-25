import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarCheck,
  CalendarClock,
  Camera,
  Heart,
  IndianRupee,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Navigation,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAUNCH_DATE_LABEL, LAUNCH_DATE_SHORT } from "@/lib/launch";

type Feature = { icon: LucideIcon; title: string; body: string };

const featureGroups: { title: string; subtitle: string; features: Feature[] }[] = [
  {
    title: "Find the right PG",
    subtitle: "Search the way you actually live: by where you need to be every day.",
    features: [
      {
        icon: Navigation,
        title: "Search by commute",
        body: "Enter your office or college and see PGs sorted by travel time by metro, car, cycle or on foot.",
      },
      {
        icon: MapIcon,
        title: "Explore on the map",
        body: "See every PG on a map with nearby metro stations, hospitals, groceries and places to eat.",
      },
      {
        icon: SlidersHorizontal,
        title: "Filters that matter",
        body: "Budget, single or shared rooms, boys or girls PG, food, AC, amenities and move-in date.",
      },
    ],
  },
  {
    title: "Know exactly what you get",
    subtitle: "No surprises after you move in.",
    features: [
      {
        icon: BadgeCheck,
        title: "Verified listings",
        body: "Our team checks the location, photos and pricing of every PG before it goes live.",
      },
      {
        icon: Camera,
        title: "Real photos",
        body: "Photos of the actual rooms, bathrooms and common areas, uploaded by the owner.",
      },
      {
        icon: IndianRupee,
        title: "Transparent pricing",
        body: "Rent, deposit, maintenance, electricity and food charges shown upfront for every room type.",
      },
      {
        icon: BedDouble,
        title: "Live bed availability",
        body: "See how many beds are free right now and when the owner last updated it.",
      },
      {
        icon: Star,
        title: "Reviews from residents",
        body: "Ratings for cleanliness, food, location, management and value from people who lived there.",
      },
    ],
  },
  {
    title: "Decide and move in",
    subtitle: "Shortlist, visit and talk to the owner, all in one place.",
    features: [
      {
        icon: Heart,
        title: "Save your shortlist",
        body: "Save PGs you like and come back to them anytime from any device.",
      },
      {
        icon: Scale,
        title: "Compare side by side",
        body: "Put up to 3 PGs next to each other: rent, sharing, amenities, rules and location.",
      },
      {
        icon: CalendarCheck,
        title: "Book a visit",
        body: "Pick a date and time slot and the owner confirms. No endless phone calls.",
      },
      {
        icon: MessageCircle,
        title: "Talk to owners directly",
        body: "Send an enquiry or chat with the owner. No brokers and no brokerage.",
      },
      {
        icon: ShieldAlert,
        title: "Report a listing",
        body: "Wrong price, fake photos or already full? Report it and our team will look into it.",
      },
    ],
  },
];

const cities = ["Gurgaon", "Noida", "Greater Noida", "Delhi"];

const previewPgs = [
  {
    name: "Sunrise Boys PG",
    meta: "DLF Phase 3 · Double sharing · Food included",
    rent: "₹9,500",
    commute: "12 min",
    image:
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=400&q=70",
  },
  {
    name: "Green Nest Girls PG",
    meta: "Sector 24 · Single room · AC",
    rent: "₹14,000",
    commute: "18 min",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=70",
  },
];

const steps = [
  { title: "Search", body: "Tell us where you work or study and your budget." },
  { title: "Compare", body: "Check photos, prices, rules, reviews and availability." },
  { title: "Visit and move in", body: "Book a visit, talk to the owner and move in." },
];

const faqs = [
  {
    q: "When can I start searching?",
    a: `pgDoor opens for tenants on ${LAUNCH_DATE_LABEL}. Right now PG owners are adding their listings so there is plenty to choose from on day one.`,
  },
  {
    q: "Is pgDoor free for tenants?",
    a: "Yes. Searching, saving, comparing, booking visits and contacting owners is free. There is no brokerage.",
  },
  {
    q: "Which cities will be available?",
    a: "We are starting with Delhi NCR: Gurgaon, Noida, Greater Noida and Delhi.",
  },
  {
    q: "How do you make sure listings are real?",
    a: "Every PG is reviewed by our team before it goes live, owners verify their phone number, and anyone can report a listing that looks wrong.",
  },
];

function daysUntilLaunch() {
  const launch = new Date("2027-01-01T00:00:00+05:30").getTime();
  return Math.max(0, Math.ceil((launch - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function TenantLaunchHome() {
  const days = daysUntilLaunch();

  return (
    <div>
      <section className="bg-white">
        <div className="container-pg grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-ink">
              <CalendarClock className="h-4 w-4 text-primary" />
              Launching {LAUNCH_DATE_SHORT} · Delhi NCR
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Find a PG near your office or college. <span className="text-primary">No brokerage.</span>
            </h1>
            <p className="mt-3 max-w-lg text-base text-ink/70 md:text-lg">
              pgDoor shows verified PGs with real photos, clear prices and live bed availability, sorted by
              how long your daily commute will be.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="#features">See what&apos;s coming</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/owners">Own a PG? List it free</Link>
              </Button>
            </div>
            {days > 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-ink">{days} days</span> until tenants can start searching.
              </p>
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-md" aria-label="Preview of pgDoor search">
            <div className="rounded-[24px] bg-canvas p-4 ring-1 ring-border">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm shadow-card">
                <Navigation className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 truncate font-medium text-ink">Cyber City, Gurgaon</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">≤ 20 min by metro</span>
              </div>
              <ul className="mt-3 space-y-3">
                {previewPgs.map((pg, i) => (
                  <li key={pg.name} className="flex gap-3 rounded-[18px] bg-white p-3 shadow-card">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[12px]">
                      <Image
                        src={pg.image}
                        alt="Example PG room"
                        fill
                        priority={i === 0}
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink">
                        {pg.name}
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{pg.meta}</p>
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <p className="text-sm font-bold text-ink">
                          {pg.rent} <span className="text-xs font-normal text-muted-foreground">/ bed</span>
                        </p>
                        <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
                          {pg.commute}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-xs text-muted-foreground">Preview · example listings</p>
            </div>
          </div>
        </div>
      </section>

      <div id="features" className="scroll-mt-20">
        {featureGroups.map((group) => (
          <section key={group.title} className="container-pg py-10">
            <h2 className="text-2xl font-bold text-ink">{group.title}</h2>
            <p className="mt-1 text-muted-foreground">{group.subtitle}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map((feature) => (
                <div key={feature.title} className="rounded-[18px] bg-white p-5 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                    <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </span>
                  <p className="mt-3 font-semibold text-ink">{feature.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="container-pg py-10">
        <h2 className="text-2xl font-bold text-ink">How it will work</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-[18px] bg-white p-5 shadow-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-3 text-lg font-semibold text-ink">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-pg py-10">
        <h2 className="text-2xl font-bold text-ink">Starting with Delhi NCR</h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cities.map((city) => (
            <li key={city} className="flex min-h-14 items-center gap-2 rounded-[18px] bg-white px-4 py-3 shadow-card">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <span className="font-semibold text-ink">{city}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="list-your-pg" className="container-pg scroll-mt-20 py-10">
        <div className="overflow-hidden rounded-[24px] bg-ink text-white">
          <div className="grid gap-8 px-6 py-10 md:grid-cols-[1.4fr_1fr] md:items-center md:px-12">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Free PG listing
              </span>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">Own a PG? List it on pgDoor for free.</h2>
              <p className="mt-3 max-w-xl text-white/75">
                Get your PG in front of students and working professionals from day one. Owners who list before{" "}
                {LAUNCH_DATE_SHORT} get a featured spot at launch.
              </p>
              <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                <Link href="/owners">
                  List your PG for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "No listing fee, no commission, no brokerage",
                "Add rooms, rent and photos from your phone in about 5 minutes",
                "Direct enquiries and visit requests from verified tenants",
                "Featured placement for early owners on launch day",
              ].map((item) => (
                <li key={item} className="flex gap-3 rounded-[14px] bg-white/5 p-3">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-pg py-10">
        <h2 className="text-2xl font-bold text-ink">Questions</h2>
        <div className="mt-6 max-w-3xl divide-y divide-border rounded-[18px] bg-white shadow-card">
          {faqs.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {item.q}
                <span className="text-xl leading-none text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-ink/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
