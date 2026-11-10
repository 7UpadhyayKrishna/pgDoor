import Link from "next/link";
import Image from "next/image";
import { Camera, CheckCircle2, IndianRupee, ShieldCheck } from "lucide-react";
import { HeroSearch } from "@/components/search/hero-search";
import { PgCard } from "@/components/search/pg-card";
import { Button } from "@/components/ui/button";
import { QUICK_CHIPS } from "@/lib/constants";
import { getCachedFeatured } from "@/modules/search";
import { getCachedCityInventory, type CityInventory } from "@/modules/locations";
import { cn } from "@/lib/utils";

/** Landmark photos for cities with no listings yet; live cities use a real listing photo. */
const CITY_FALLBACK_PHOTO: Record<string, string> = {
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
  noida: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
};

function CityTile({
  city,
  className,
  sizes,
}: {
  city: CityInventory;
  className?: string;
  sizes: string;
}) {
  const live = city.count > 0;
  const photo = city.photo ?? CITY_FALLBACK_PHOTO[city.slug] ?? null;
  const body = (
    <>
      {photo ? (
        <Image
          src={photo}
          alt={live ? `A PG in ${city.name}` : city.name}
          fill
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-[1.03]",
            !live && "grayscale-[60%]",
          )}
          sizes={sizes}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft to-canvas" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-4 text-white">
        <span className="block text-lg font-semibold">{city.name}</span>
        <span className="block text-sm text-white/85">
          {live ? `${city.count} PGs` : "Coming soon"}
        </span>
      </span>
    </>
  );
  if (!live) {
    return (
      <div aria-label={`${city.name}, coming soon`} className={cn("relative overflow-hidden", className)}>
        {body}
      </div>
    );
  }
  return (
    <Link href={`/pgs/${city.slug}`} className={cn("group relative overflow-hidden", className)}>
      {body}
    </Link>
  );
}

export async function MarketplaceHome() {
  const [featured, cities] = await Promise.all([
    getCachedFeatured(8),
    getCachedCityInventory().catch(() => [] as CityInventory[]),
  ]);
  const tiles = cities.slice(0, 4);

  return (
    <div>
      <section className="bg-white">
        <div className="container-pg py-10 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Find the best PG for your daily life.
              </h1>
              <p className="mt-2 text-muted-foreground">
                Search by office or college. Filter by commute and budget. Explore on the map.
              </p>
              <div className="mt-6">
                <HeroSearch />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {QUICK_CHIPS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-medium text-ink ring-1 ring-border hover:bg-primary-soft hover:text-ink hover:ring-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden h-[420px] grid-cols-2 grid-rows-3 gap-3 lg:grid">
              {tiles.map((city, i) => (
                <CityTile
                  key={city.slug}
                  city={city}
                  className={cn("rounded-[24px]", i === 0 && "row-span-3")}
                  sizes={i === 0 ? "360px" : "220px"}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-pg py-10 lg:hidden">
        <h2 className="text-xl font-semibold">Popular locations</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tiles.map((city) => (
            <CityTile
              key={city.slug}
              city={city}
              className="block aspect-[16/10] rounded-[18px]"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
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
            { icon: ShieldCheck, title: "Commute first", body: "See travel time and true monthly cost to your office or college." },
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
            { n: "02", t: "Compare", d: "Check rooms, pricing, amenities, house rules and availability." },
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
