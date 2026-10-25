import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AreaSearch } from "@/components/search/area-search";
import { NAV } from "@/lib/constants";
import type { AuthUser } from "@/lib/rbac";
import { canAccessAdmin, canAccessOwner } from "@/lib/rbac";
import { isPrelaunch } from "@/lib/launch";

export { Logo };

function PrelaunchHeader({ user }: { user: AuthUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="container-pg flex h-16 items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          {canAccessAdmin(user) ? (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
          {canAccessOwner(user) ? (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/owners/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login?next=/owners/dashboard">Owner login</Link>
            </Button>
          )}
          <Button asChild size="sm" className="sm:h-11 sm:px-4">
            <Link href="/owners">
              <span className="sm:hidden">List your PG</span>
              <span className="hidden sm:inline">List your PG free</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteHeader({ user }: { user: AuthUser | null }) {
  if (isPrelaunch()) {
    return <PrelaunchHeader user={user} />;
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="container-pg flex h-16 items-center gap-3 md:gap-4">
        <div className="flex shrink-0 items-center gap-6 lg:gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 lg:flex">
            {NAV.desktop.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <AreaSearch
          variant="header"
          className="min-w-0 flex-1 max-w-xl"
          placeholder="Search by area"
        />

        <div className="flex shrink-0 items-center gap-2">
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
