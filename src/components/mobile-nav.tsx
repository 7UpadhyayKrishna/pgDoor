"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Inbox, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pgs", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/account/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/account", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/owners/") && pathname !== "/owners" && pathname !== "/owners/register") {
    return null;
  }
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
