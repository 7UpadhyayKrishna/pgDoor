import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "pgDoor",
    links: [
      { href: "/pgs", label: "Find PGs" },
      { href: "/owners/register", label: "List Your PG" },
      { href: "/pgs/gurgaon", label: "PGs by City" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help Center" },
    ],
  },
  {
    title: "Popular Cities",
    links: [
      { href: "/pgs/gurgaon", label: "Gurgaon" },
      { href: "/pgs/noida", label: "Noida" },
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
      { href: "/about", label: "About pgDoor" },
      { href: "/contact", label: "Careers" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/help", label: "Refund Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-white pb-24 md:pb-8">
      <div className="container-pg grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            Find your next PG. Verified listings, real photos, real availability.
          </p>
        </div>
        {columns.slice(1).map((col) => (
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
