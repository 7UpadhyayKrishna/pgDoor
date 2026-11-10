import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "pgDoor — Find your next PG.",
    template: "%s · pgDoor",
  },
  description:
    "Find a PG by your daily commute. Real photos, listed rent and true monthly cost for PGs across Gurgaon and NCR.",
  manifest: "/manifest.json",
  applicationName: "pgDoor",
  openGraph: {
    type: "website",
    siteName: "pgDoor",
    locale: "en_IN",
    title: "pgDoor — Find your next PG.",
    description: "Find a PG by your daily commute. Real photos, listed rent and true monthly cost.",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  themeColor: "#7A9B80",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans antialiased min-h-screen bg-canvas text-ink`}>
        {children}
      </body>
    </html>
  );
}
