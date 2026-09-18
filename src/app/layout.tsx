import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "pgDoor — Find your next PG.",
    template: "%s · pgDoor",
  },
  description:
    "Verified PGs. Real photos. Real availability.",
  manifest: "/manifest.json",
  applicationName: "pgDoor",
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
