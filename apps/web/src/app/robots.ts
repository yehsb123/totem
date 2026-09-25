import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // 로그인 흐름 전용 페이지는 색인하지 않는다 (페이지 자체도 noindex)
    rules: { userAgent: "*", allow: "/", disallow: ["/invite", "/auth/"] },
    sitemap: `${siteBaseUrl()}/sitemap.xml`,
  };
}
