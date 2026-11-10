import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/account",
          "/saved",
          "/alerts",
          "/owners/dashboard",
          "/owners/properties",
          "/owners/leads",
          "/owners/availability",
          "/testing",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
