import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent parent-directory lockfiles from shifting the app root
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
