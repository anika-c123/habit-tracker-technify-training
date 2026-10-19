import type { Metadata, Viewport } from "next";
import { Fraunces, Newsreader } from "next/font/google";
import { ServiceWorkerRegister } from "./service-worker-register";
import "./globals.css";

// next/font downloads these at build time and serves them from our own site,
// so there's no request to Google when someone opens the app.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track shared daily habits with your friends.",
  // iPhones read these when the app is added to the home screen: open it
  // full-screen, with this name under the icon. (The icon itself comes from
  // app/apple-icon.png.)
  appleWebApp: {
    capable: true,
    title: "Habits",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
