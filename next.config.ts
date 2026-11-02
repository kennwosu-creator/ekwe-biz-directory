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

  /* Mobile Network & Image Optimization Rules */
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [65, 75], // Fixes unconfigured quality warning
    minimumCacheTTL: 86400, // Cache shop images locally for 24 hours on mobile devices
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;