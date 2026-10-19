import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Dev server only: let a phone on the same Wi-Fi load the app via the Mac's
  // network address (the "Network:" line `npm run dev` prints). Update it if
  // that address changes.
  allowedDevOrigins: ["10.197.91.45"],
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
