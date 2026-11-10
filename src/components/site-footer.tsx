import Link from "next/link";
import { Logo } from "@/components/logo";
import { LAUNCH_DATE_LABEL } from "@/lib/launch";
import { getCachedCityInventory, type CityInventory } from "@/modules/locations";

type FooterLink = { href?: string; label: string };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "For Owners",
    links: [
      { href: "/owners/register", label: "List your PG free" },
      { href: "/login?next=/owners/dashboard", label: "Owner login" },
      { href: "/owners/dashboard", label: "Owner dashboard" },
      { href: "/owners#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help center" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
];

const prelaunchColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: "For Owners",
    links: [
      { href: "/owners", label: "List your PG free" },
      { href: "/login?next=/owners/dashboard", label: "Owner login" },
      { href: "/owners/dashboard", label: "Owner dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

function cityLinks(cities: CityInventory[]): FooterLink[] {
  return cities.map((city) =>
    city.count > 0
      ? { href: `/pgs/${city.slug}`, label: `PGs in ${city.name}` }
      : { label: `${city.name} · coming soon` },
  );
}

export async function SiteFooter({ prelaunch }: { prelaunch: boolean }) {
  const cities = prelaunch ? [] : await getCachedCityInventory().catch(() => []);
  const visibleColumns = prelaunch
    ? prelaunchColumns
    : [
        {
          title: "Find a PG",
          links: [{ href: "/pgs", label: "Explore all PGs" }, ...cityLinks(cities)],
        },
        ...columns,
      ];
  return (
    <footer className="mt-16 border-t border-border bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
      <div className="container-pg grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            {prelaunch
              ? `PGs across Delhi NCR, searchable by your commute. Opening to tenants on ${LAUNCH_DATE_LABEL}.`
              : "Find your next PG by commute. Real photos, listed rent and true monthly cost."}
          </p>
        </div>
        {visibleColumns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map((link) => (
                <li key={(link.href ?? "") + link.label}>
                  {link.href ? (
                    <Link href={link.href} className="inline-block py-1 hover:text-ink">
                      {link.label}
                    </Link>
                  ) : (
                    <span className="inline-block py-1">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
