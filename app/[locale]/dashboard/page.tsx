"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import LoadingPage from "@/components/Loading";
import SideBar from "@/components/UserDashboard/Sidebar";
import Navbar from "@/components/UserDashboard/Navbar";
import UserProfile from "@/components/UserDashboard/UserProfile";
import Assessment from "@/components/UserDashboard/Assessments/Assessment";
import NoRoofTop from "@/components/UserDashboard/NoRooftop";
import PDFReport from "@/components/UserDashboard/PdfReport";
import Insights from "@/components/UserDashboard/Insights/Insights";
import Community from "@/components/UserDashboard/Community";
// import InstallPage from "@/components/UserDashboard/Install";
import InstallPage from "@/components/UserDashboard/Install/Install2";
import ProDashboard from "@/components/UserDashboard/ProUser";
import ChatWidget from "@/components/ChatWidget";
import { getPreviousMonthRange } from "@/utils/date";
import RainfallStrip from "@/components/RainfallStrip";
import Donate from "@/components/UserDashboard/Donate/Donate";

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function sqftToM2(sqft: number): number {
  return !sqft || sqft < 0 ? 0 : sqft * 0.092903;
}

interface RoofTopData {
  rooftop: {
    area: string;
    type: string;
    dwellers: string;
    space: string;
    runOffCoefficient: number;
  };
}

const Page = () => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [hasRooftop, setHasRooftop] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string>("inactive");
  const [activeItem, setActiveItem] = useState("assessment");

  const [rooftopData, setRooftopData] = useState<RoofTopData>();
  const [rainfall, setRainfall] = useState<number>(0);

  const { startDate, endDate } = getPreviousMonthRange();

  // TEMP: Static location (Mumbai)
  const lat = 19.076;
  const lon = 72.8777;

  // -----------------------------
  // AUTH + USER FIRESTORE FETCH
  // -----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (
        (!currentUser || currentUser.email === "admin123@admin.com") &&
        !currentUser?.emailVerified
      ) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // Firestore listener
      const userDocRef = doc(firestore, "users", currentUser.uid);

      const unsubSnapshot = onSnapshot(userDocRef, (snapshot) => {
        if (!snapshot.exists()) {
          setHasRooftop(false);
          setLoading(false);
          return;
        }

        try {
          const data = snapshot.data();
          setStatus(data.status);

          const rt = data as RoofTopData;

          const valid =
            rt.rooftop.area &&
            rt.rooftop.type &&
            rt.rooftop.space &&
            rt.rooftop.dwellers;

          if (valid) {
            setHasRooftop(true);
            setRooftopData(rt);
          } else {
            setHasRooftop(false);
          }
        } catch (err) {
          setHasRooftop(false);
        }

        setLoading(false); // Only after Firestore responds
      });

      return () => unsubSnapshot();
    });

    return () => unsubscribe();
  }, [router]);

  // -----------------------------
  // RAINFALL FETCH (Only once)
  // -----------------------------
  useEffect(() => {
    if (!lat || !lon) return;

    const fetchRainfall = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=rain&start_date=${startDate}&end_date=${endDate}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch rainfall");

        const data = await res.json();
        const rainfallArray = data?.hourly?.rain || [];

        const total = rainfallArray.reduce(
          (sum: number, v: number) => sum + (v || 0),
          0
        );
        setRainfall(total);
      } catch (err) {
        console.error("Rainfall error:", err);
      }
    };

    fetchRainfall();
  }, [lat, lon, startDate, endDate]);

  // -----------------------------
  // MONTH NAME
  // -----------------------------
  const lastMonthName = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1
  ).toLocaleString("en-IN", { month: "long" });

  // -----------------------------
  // RAIN CAPTURE CALC
  // -----------------------------
  const roofRainCaptured =
    sqftToM2(Number(rooftopData?.rooftop.area)) *
    Number(rooftopData?.rooftop.runOffCoefficient) *
    mmToM(rainfall) *
    1000;

  // -----------------------------
  // RAIN CAPTURE CALC
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const usersDoc = doc(firestore, "users", user.uid);

    const unsubscribe = onSnapshot(usersDoc, async (snapshot) => {
      if (!snapshot.exists()) return;

      try {
        const data = snapshot.data();

        // Only act when status === inactive
        if (data.status === "inactive") {
          await setDoc(
            usersDoc,
            {
              monthlyCollected: {
                [lastMonthName]: {
                  rainfall: Number(roofRainCaptured.toFixed(2)),
                  harvested: 0,
                },
              },
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Update error:", e);
      }
    });

    return () => unsubscribe();
  }, [user, lastMonthName, roofRainCaptured]);

  // -----------------------------
  // GLOBAL LOADING FIRST
  // -----------------------------
  if (loading) return <LoadingPage />;

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      <SideBar
        username={user?.displayName}
        email={user?.email}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar
          status={status}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

        <main className="relative z-[-1] flex-1 overflow-y-auto h-screen">
          {/* Assessment */}
          {activeItem === "assessment" &&
            (hasRooftop ? (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <Assessment rainfall={rainfall} />
              </>
            ) : (
              <NoRoofTop setActiveItem={setActiveItem} />
            ))}

          {/* Insights */}
          {activeItem === "insights" &&
            (hasRooftop ? (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <Insights lastMonthRainfall={rainfall} />
              </>
            ) : (
              <NoRoofTop setActiveItem={setActiveItem} />
            ))}

          {/* Install */}
          {activeItem === "install" &&
            (hasRooftop ? (
              <>
                {/* <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                /> */}
                {/* <InstallPage /> */}
                <InstallPage />
              </>
            ) : (
              <NoRoofTop setActiveItem={setActiveItem} />
            ))}

          {/* Community */}
          {activeItem === "community" &&
            (hasRooftop ? (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <Community />
              </>
            ) : (
              <NoRoofTop setActiveItem={setActiveItem} />
            ))}

          {/* Pro */}
          {activeItem === "pro" &&
            (hasRooftop ? (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <ProDashboard />
              </>
            ) : (
              <NoRoofTop setActiveItem={setActiveItem} />
            ))}

          {/* PDF */}
          {activeItem === "pdf" &&
            (hasRooftop ? (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <PDFReport />
              </>
            ) : (
              <NoRoofTop setActiveItem={setActiveItem} />
            ))}

          {/* Profile */}
          {activeItem === "profile" && <UserProfile />}

          {/* Donating System */}
          {activeItem === "donate" && <Donate />}
        </main>
      </div>

      <ChatWidget />
    </div>
  );
};

export default Page;
