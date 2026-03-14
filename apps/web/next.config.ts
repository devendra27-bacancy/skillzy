import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@skillzy/types", "@skillzy/ui"],
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
