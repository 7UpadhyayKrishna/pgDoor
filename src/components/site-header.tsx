import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NAV } from "@/lib/constants";
import type { AuthUser } from "@/lib/rbac";
import { canAccessAdmin, canAccessOwner } from "@/lib/rbac";

export { Logo };

export function SiteHeader({ user }: { user: AuthUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="container-pg flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70">
            {NAV.desktop.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
            <Link href="/saved" aria-label="Saved PGs">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          {canAccessOwner(user) ? (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/owners/dashboard">Dashboard</Link>
            </Button>
          ) : null}
          {canAccessAdmin(user) ? (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/owners/register">List Your PG</Link>
          </Button>
          {user ? (
            <Button asChild variant="outline">
              <Link href="/account">{user.name ?? "Profile"}</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
