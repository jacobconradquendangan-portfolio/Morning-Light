import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // LAN origins permitted to load dev resources (HMR) — update when the
  // machine's local IP changes.
  allowedDevOrigins: ['192.168.100.152'],
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
