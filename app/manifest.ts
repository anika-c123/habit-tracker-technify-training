import type { MetadataRoute } from "next";

// The web app manifest: tells phones how to install the app on the home
// screen (name, icon, colors) and to open it full-screen like a native app
// ("standalone") instead of inside the browser. Next serves this file at
// /manifest.webmanifest and links it from every page automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Habit Tracker",
    short_name: "Habits", // shown under the home-screen icon
    description: "Track shared daily habits with your friends.",
    start_url: "/groups", // logged-out users get sent on to /login
    display: "standalone",
    background_color: "#ffffff", // splash screen while the app starts
    theme_color: "#ffffff", // browser / status bar color
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // "maskable" lets Android crop the icon into its own shape. Our icon
      // keeps everything in the middle 80%, so the same image works.
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
