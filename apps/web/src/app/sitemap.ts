import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, siteBaseUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  return PUBLIC_PAGES.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" || path === "/pricing" ? "weekly" : "monthly",
    priority:
      path === "/"
        ? 1
        : path.startsWith("/features") || path === "/pricing"
          ? 0.8
          : 0.5,
  }));
}
