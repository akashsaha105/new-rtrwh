"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";
// import { doc, getDoc } from "firebase/firestore";
import LoadingPage from "@/components/Loading";
import SideBar from "@/components/AdminDashboard/SideBar";
import Navbar from "@/components/AdminDashboard/NavBar";
import Users from "@/components/AdminDashboard/Users";
import Product from "@/components/AdminDashboard/Product";
import OrdersPage from "@/components/AdminDashboard/Orders";
import AdminNotification from "@/components/AdminDashboard/AdminNotification";
import MaintenanceUsers from "@/components/AdminDashboard/MaintenanceUsers";

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Sidebar states
  const [activeItem, setActiveItem] = useState("overview");

  // Auth check + Firestore rooftop check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email != "admin123@admin.com") {
        router.push("/");
        console.log("User is not authenticated");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <LoadingPage />;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-sky-900 text-white">
      <SideBar
        username={"admin"}
        email={user?.email}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />
        {/* Content */}
        <main className="relative z-[-1] flex-1 pt-6 p-6 overflow-y-auto">
          {/* Assessment */}
          <div className={activeItem === "overview" ? "block" : "hidden"}>
            Dashboard Overview
          </div>

          {/* Insights */}
          <div className={activeItem === "orders" ? "block" : "hidden"}>
            <OrdersPage />  
          </div>

          {/* Users */}
          <div className={activeItem === "users" ? "block" : "hidden"}>
            <Users />
          </div>

          {/* Users */}
          <div className={activeItem === "maintenance" ? "block" : "hidden"}>
            <MaintenanceUsers />
          </div>

          {/* Products */}
          <div className={activeItem === "products" ? "block" : "hidden"}>
            <Product />
          </div>

          {/* Analytics */}
          <div className={activeItem === "notifications" ? "block" : "hidden"}>
            <AdminNotification />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Page;
