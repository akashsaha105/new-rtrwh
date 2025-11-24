import Link from "next/link";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { LayoutDashboard } from "lucide-react";
import LoadingPage from "./Loading";

const DashboardButton = () => {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser?.email) {
        setUserEmail(currentUser.email);
      } else {
        setUserEmail(""); // reset if user logs out
      }
    });

    return () => unsubscribe(); // cleanup listener
  }, []);

  return (
    <Link
      href={
        userEmail === "admin123@admin.com"
          ? "/en/adminDashboard"
          : "/en/dashboard"
      }
      onClick={() => <LoadingPage />}
      className="relative group flex items-center gap-2 px-5 py-2
                 rounded-xl font-semibold text-white 
                 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] 
                 shadow-lg hover:shadow-[#00b4d8]/40 hover:scale-105
                 transition-all duration-300"
    >
      {/* Icon */}
      <LayoutDashboard className="w-5 h-5" />

      {/* Text */}
      <span>Dashboard</span>

      {/* Glow Effect */}
      <span
        className="absolute inset-0 rounded-xl bg-gradient-to-r 
                   from-[#0077b6] to-[#00b4d8] opacity-0 
                   blur-xl group-hover:opacity-30 transition duration-500"
      />
    </Link>
  );
};

export default DashboardButton;
