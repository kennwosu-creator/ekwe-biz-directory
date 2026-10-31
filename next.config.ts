import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable cacheComponents to allow direct database queries in Server Components */
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;