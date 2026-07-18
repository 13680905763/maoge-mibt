import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESA Pages supports Next.js static generation, so export plain files.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
