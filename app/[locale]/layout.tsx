import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import { NextIntlClientProvider } from "next-intl";
import Navbar from "@/components/Navbar";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import "leaflet/dist/leaflet.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider>
      <StoreProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ConditionalNavbar />
            {children}
          </body>
        </html>
      </StoreProvider>
    </NextIntlClientProvider>
  );
}
