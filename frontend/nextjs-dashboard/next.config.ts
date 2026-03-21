import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow importing local dataset files from project root.
    externalDir: true,
  },
};

export default nextConfig;
