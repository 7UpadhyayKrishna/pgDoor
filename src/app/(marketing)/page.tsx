import Link from "next/link";
import Image from "next/image";
import { Camera, CheckCircle2, IndianRupee, ShieldCheck } from "lucide-react";
import { HeroSearch } from "@/components/search/hero-search";
import { PgCard } from "@/components/search/pg-card";
import { Button } from "@/components/ui/button";
import { QUICK_CHIPS } from "@/lib/constants";
import { listCities } from "@/modules/locations";
import { getFeatured } from "@/modules/search";

export const dynamic = "force-dynamic";

const locations = [
  {
    name: "Gurgaon",
    href: "/pgs/gurgaon",
    image:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Noida",
    href: "/pgs/noida",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Delhi",
    href: "/pgs/delhi",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
  },
];

export default async function HomePage() {
  const [cities, featured] = await Promise.all([listCities(), getFeatured(8)]);

  return (
    <div>
      <section className="bg-white">
        <div className="container-pg py-10 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Find your next PG.
              </h1>
              <p className="mt-2 text-muted-foreground">
                Verified PGs. Real photos. Real availability.
              </p>
              <div className="mt-6">
                <HeroSearch cities={cities.map((c) => ({ name: c.name, slug: c.slug }))} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {QUICK_CHIPS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-border hover:bg-primary-soft hover:text-ink hover:ring-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden h-[420px] grid-cols-2 grid-rows-2 gap-3 lg:grid">
              {locations.map((loc, i) => (
                <Link
                  key={loc.href}
                  href={loc.href}
                  className={`group relative overflow-hidden rounded-[24px] ${i === 0 ? "row-span-2" : ""}`}
                >
                  <Image
                    src={loc.image}
                    alt={loc.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes={i === 0 ? "360px" : "220px"}
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 text-lg font-semibold text-white">
                    {loc.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-pg py-10 lg:hidden">
        <h2 className="text-xl font-semibold">Popular locations</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {locations.map((loc) => (
            <Link key={loc.href} href={loc.href} className="group">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[18px]">
                <Image
                  src={loc.image}
                  alt={loc.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <p className="mt-2 font-semibold">{loc.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-pg py-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">Explore PGs</h2>
          <Link href="/pgs" className="text-sm font-medium text-ink">
            See all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((property) => (
            <PgCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="container-pg py-10">
        <h2 className="text-xl font-semibold">Why pgDoor?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Verified PGs", body: "Properties and owners are verified." },
            { icon: Camera, title: "Real photos", body: "See the actual property before visiting." },
            { icon: CheckCircle2, title: "Fresh availability", body: "Know when availability was last updated." },
            { icon: IndianRupee, title: "Transparent pricing", body: "See rent, deposit and extra charges clearly." },
          ].map((item) => (
            <div key={item.title} className="rounded-[18px] bg-white p-5 shadow-card">
              <item.icon className="h-5 w-5 text-ink" strokeWidth={1.8} />
              <p className="mt-3 font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-pg py-6">
        <h2 className="text-xl font-semibold">How it works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Search", d: "Find PGs by location, budget and preferences." },
            { n: "02", t: "Compare", d: "Check rooms, pricing, amenities, reviews and availability." },
            { n: "03", t: "Move in", d: "Talk to the owner and schedule a visit." },
          ].map((s) => (
            <div key={s.n} className="rounded-[18px] bg-white p-5 shadow-card">
              <p className="text-sm font-bold text-primary">{s.n}</p>
              <p className="mt-1 text-lg font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-pg py-10">
        <div className="rounded-[24px] bg-primary-soft px-6 py-10 md:px-12">
          <h2 className="text-3xl font-bold text-ink">Have a PG?</h2>
          <p className="mt-2 text-ink/70">
            Fill vacant beds with people actively looking for accommodation.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button asChild>
              <Link href="/owners/register">List Your PG</Link>
            </Button>
            <Link href="/owners" className="text-sm font-semibold text-ink">
              Learn more →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
