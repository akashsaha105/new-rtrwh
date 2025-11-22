"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide for ANY route starting with /en/dashboard
  if (
    pathname.startsWith("/en/dashboard") ||
    pathname.startsWith("/en/adminDashboard") ||
    pathname.startsWith("/hi/dashboard") ||
    pathname.startsWith("/hi/adminDashboard") ||
    pathname.startsWith("/bng/dashboard") ||
    pathname.startsWith("/bng/adminDashboard")
  ) {
    return null;
  }

  return <Navbar />;
}
