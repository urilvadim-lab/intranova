import type { NextConfig } from "next";

// Статическая сборка: папка out/ целиком заливается на хостинг Beget.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
