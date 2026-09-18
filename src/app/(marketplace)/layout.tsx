import { getCurrentUser } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";

export const dynamic = "force-dynamic";

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader user={user} />
      <main>{children}</main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
