import Link from "next/link";
import { Logo } from "@/components/logo";
import { LAUNCH_DATE_LABEL } from "@/lib/launch";

const columns = [
  {
    title: "pgDoor",
    links: [
      { href: "/pgs", label: "Find PGs" },
      { href: "/owners/register", label: "List Your PG" },
      { href: "/pgs/gurgaon", label: "PGs by City" },
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help Center" },
    ],
  },
  {
    title: "Popular Cities",
    links: [
      { href: "/pgs/gurgaon", label: "Gurgaon" },
      { href: "/pgs/noida", label: "Noida" },
      { href: "/pgs/greater-noida", label: "Greater Noida" },
      { href: "/pgs/delhi", label: "Delhi" },
    ],
  },
  {
    title: "For Owners",
    links: [
      { href: "/owners/register", label: "List Property" },
      { href: "/login", label: "Owner Login" },
      { href: "/owners/dashboard", label: "Owner Dashboard" },
      { href: "/owners#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/help", label: "Refund Policy" },
    ],
  },
];

const prelaunchColumns = [
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

export function SiteFooter({ prelaunch }: { prelaunch: boolean }) {
  const visibleColumns = prelaunch ? prelaunchColumns : columns.slice(1);
  return (
    <footer className="mt-16 border-t border-border bg-white pb-24 md:pb-8">
      <div className="container-pg grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            {prelaunch
              ? `Verified PGs across Delhi NCR. Opening to tenants on ${LAUNCH_DATE_LABEL}.`
              : "Find your next PG. Verified listings, real photos, real availability."}
          </p>
        </div>
        {visibleColumns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
