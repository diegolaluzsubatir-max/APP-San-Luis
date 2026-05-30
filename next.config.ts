import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone incompatible con @netlify/plugin-nextjs v5
  serverExternalPackages: ["@prisma/client", "prisma"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
};

export default nextConfig;
