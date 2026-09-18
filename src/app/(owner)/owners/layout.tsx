import Link from "next/link";
import { Building2, CalendarCheck, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/owners/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/owners/properties", label: "Properties", icon: Building2 },
  { href: "/owners/leads", label: "Leads", icon: MessageSquare },
  { href: "/owners/availability", label: "Availability", icon: CalendarCheck },
];

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-white">
        <div className="container-pg flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-muted-foreground">
              {user?.name ?? user?.phone}
            </span>
            <form
              action={async () => {
                "use server";
                const { logout } = await import("@/modules/auth");
                const { redirect } = await import("next/navigation");
                await logout();
                redirect("/");
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-pg flex flex-col gap-6 py-6 md:flex-row">
        <aside className="md:w-56 shrink-0">
          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-ink"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
