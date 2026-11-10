import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/lab/", "/v1/", "/v2/", "/v3/", "/v4/"] },
    sitemap: "https://intranova.ru/sitemap.xml",
    host: "https://intranova.ru",
  };
}
