import type { Metadata, Viewport } from "next";
import { Fraunces, Newsreader } from "next/font/google";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
