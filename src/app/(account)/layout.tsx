import { getCurrentUser } from "@/lib/session";
import { isPrelaunchForViewer } from "@/lib/launch-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, prelaunch] = await Promise.all([getCurrentUser(), isPrelaunchForViewer()]);
  return (
    <>
      <SiteHeader user={user} prelaunch={prelaunch} />
      <main className="container-pg py-8">{children}</main>
      <SiteFooter prelaunch={prelaunch} />
      <MobileNav prelaunch={prelaunch} />
    </>
  );
}
