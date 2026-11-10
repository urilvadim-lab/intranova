import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://intranova.ru/", changeFrequency: "weekly", priority: 1 },
    { url: "https://intranova.ru/karachinsev/", changeFrequency: "monthly", priority: 0.5 },
  ];
}
