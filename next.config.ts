import type { NextConfig } from "next";
import { CITY_SLUG_ALIASES } from "./src/lib/cities";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      ...Object.entries(CITY_SLUG_ALIASES).flatMap(([alias, slug]) => [
        { source: `/pgs/${alias}`, destination: `/pgs/${slug}`, permanent: true },
        { source: `/pgs/${alias}/:area`, destination: `/pgs/${slug}/:area`, permanent: true },
      ]),
      { source: "/register", destination: "/signup", permanent: false },
    ];
  },
};

export default nextConfig;
