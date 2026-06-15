import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // instrumentation.ts is enabled by default in Next 15; kept explicit for clarity.
  experimental: {
    // Allow server actions from local tenant subdomains during dev.
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.localhost:3000"],
    },
  },
};

export default nextConfig;
