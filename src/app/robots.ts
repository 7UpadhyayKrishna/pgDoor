import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PRIVATE_PATHS = [
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
];

/** AI answer engines we want reading (and citing) public content, especially the guides. */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: ["/", "/blog/", "/llms.txt", "/llms-full.txt"], disallow: PRIVATE_PATHS },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
