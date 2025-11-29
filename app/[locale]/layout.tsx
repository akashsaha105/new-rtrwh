import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import { NextIntlClientProvider } from "next-intl";
import Navbar from "@/components/Navbar";
import ConditionalNavbar from "@/components/ConditionalNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JalYantra",
  description:
    "AI-Powered Rainwater Harvesting Solutions for a Sustainable Future",
};

import FeasibilityUpdater from "@/components/FeasibilityUpdater";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider>
      <StoreProvider>
        <html lang="en">
          <head>
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossOrigin=""
            />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <FeasibilityUpdater />
            <ConditionalNavbar />
            {children}
          </body>
        </html>
      </StoreProvider>
    </NextIntlClientProvider>
  );
}
