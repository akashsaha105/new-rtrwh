"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import LoadingPage from "@/components/Loading";
import SideBar from "@/components/UserDashboard/Sidebar";
import Navbar from "@/components/UserDashboard/Navbar";
import UserProfile from "@/components/UserDashboard/UserProfile";
import Assessment from "@/components/UserDashboard/Assessments/Assessment";
import NoRoofTop from "@/components/UserDashboard/NoRooftop";
import PDFReport from "@/components/UserDashboard/PdfReport";
import Insights from "@/components/UserDashboard/Insights/Insights";
import Community from "@/components/UserDashboard/Community";
import InstallPage from "@/components/UserDashboard/Install";
import ProDashboard from "@/components/UserDashboard/ProUser";
import ChatWidget from "@/components/ChatWidget";
import { getPreviousMonthRange } from "@/utils/date";
import { useGeolocation } from "@/utils/geoLocation";
import RainfallStrip from "@/components/RainfallStrip";

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function sqftToM2(sqft: number): number {
  if (!sqft || sqft < 0) return 0;
  return sqft * 0.092903;
}

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRooftop, setHasRooftop] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string>("inactive");

  const router = useRouter();

  // Sidebar states
  const [activeItem, setActiveItem] = useState("assessment");

  // Rooftop Data
  interface RoofTopData {
    rooftop: {
      area: string;
      type: string;
      dwellers: string;
      space: string;
      runOffCoefficient: number;
    };
  }

  const [rooftopData, setRooftopData] = useState<RoofTopData>();

  // Auth check + Firestore rooftop check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (
        (!currentUser || currentUser.email == "admin123@admin.com") &&
        !currentUser?.emailVerified
      ) {
        router.push("/");
        console.log("User is not authenticated");
        return;
      }
      setUser(currentUser);

      try {
        const userDocRef = doc(firestore, "users", currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            try {
              const SnapShotStatus = snapshot.data().status || "inactive";
              setStatus(SnapShotStatus);

              const roofTopData = snapshot.data() as RoofTopData;
              if (
                roofTopData.rooftop.area !== "" &&
                roofTopData.rooftop.dwellers !== "" &&
                roofTopData.rooftop.space !== "" &&
                roofTopData.rooftop.type !== ""
              ) {
                setHasRooftop(true);
                setRooftopData(roofTopData);
              } else {
                setHasRooftop(false);
              }
            } catch (e) {
              console.log(e);
              setHasRooftop(false);
            }
          }
          return () => unsubscribeSnapshot();
        });
      } catch (error) {
        console.error("Error fetching rooftop data:", error);
        setHasRooftop(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const [rainfall, setRainfall] = useState<number>(0);

  const { startDate, endDate } = getPreviousMonthRange();

  // move hook call to the component top-level
  // const { lat, lon, error } = useGeolocation();

  // ================= For Testing - Mumbai =================
  const lat = 19.076;
  const lon = 72.8777;

  useEffect(() => {
    const fetchRainfall = async () => {
      // if (error) {
      //   console.error("Geolocation error:", error);
      //   return;
      // }
      if (lat == null || lon == null) {
        // wait until geolocation is available
        return;
      }

      try {
        // const lat = 55.0833;
        // const lon = 88.408064;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=rain&start_date=${startDate}&end_date=${endDate}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch rainfall data");

        const data = await res.json();

        const rainfallArray = data?.hourly?.rain || [];

        const totalRainfall = rainfallArray.reduce(
          (sum: number, v: number) => sum + (v || 0),
          0
        );

        setRainfall(totalRainfall);
      } catch (err) {
        console.error("Error fetching rainfall:", err);
      }
    };

    fetchRainfall();
  });

  // Get last month name
  const date = new Date();
  const lastMonthIndex = (date.getMonth() - 1 + 12) % 12;
  const lastMonthName = new Date(
    date.getFullYear(),
    lastMonthIndex
  ).toLocaleString("en-IN", {
    month: "long",
  });
  // console.log("Rainfall: ", rainfall);
  // console.log(startDate, endDate);

  const roofRainCaptured =
    sqftToM2(Number(rooftopData?.rooftop.area)) *
    Number(rooftopData?.rooftop.runOffCoefficient) *
    mmToM(rainfall) *
    1000;

  // if (loading) return <LoadingPage />;
  if (loading)
    return (
      <>
        <div className="p-8 relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
            <p className="text-slate-300">
              Generating feasibility assessment...
            </p>
            <p className="text-slate-400 text-sm mt-2">
              This may take 10-30 seconds
            </p>
          </div>
        </div>
      </>
    );
  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Sidebar */}
      <SideBar
        username={user?.displayName}
        email={user?.email}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Section */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar
          status={status}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

        {/* Content */}
        {/* <main className="relative z-[-1] flex-1 overflow-y-auto"> */}
        <main className="relative z-[-1] flex-1 overflow-y-auto h-screen">
          {/* {!hasRooftop ? (
            <></>
          ) : (
            <>
            </>
          )} */}

          {/* Assessment */}
          <div className={activeItem === "assessment" ? "block" : "hidden"}>
            {!hasRooftop ? (
              <>
                <div className="flex justify-center items-center h-full">
                  <NoRoofTop setActiveItem={setActiveItem} />
                </div>
              </>
            ) : (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <Assessment rainfall={rainfall} />
              </>
            )}
          </div>

          {/* Insights */}
          <div className={activeItem === "insights" ? "block" : "hidden"}>
            {!hasRooftop ? (
              <NoRoofTop setActiveItem={setActiveItem} />
            ) : (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />

                <Insights lastMonthRainfall={rainfall} />
              </>
            )}
          </div>

          {/* Installation */}
          <div className={activeItem === "install" ? "block" : "hidden"}>
            {!hasRooftop ? (
              <NoRoofTop setActiveItem={setActiveItem} />
            ) : (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />

                <InstallPage />
              </>
            )}
          </div>

          {/* Community */}
          <div className={activeItem === "community" ? "block" : "hidden"}>
            {!hasRooftop ? (
              <NoRoofTop setActiveItem={setActiveItem} />
            ) : (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />

                <Community />
              </>
            )}
          </div>

          {/* Pro Users */}
          <div className={activeItem === "pro" ? "block" : "hidden"}>
            {!hasRooftop ? (
              <NoRoofTop setActiveItem={setActiveItem} />
            ) : (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />

                <ProDashboard />
              </>
            )}
          </div>

          {/* Pdf Report */}
          <div className={activeItem === "pdf" ? "block" : "hidden"}>
            {!hasRooftop ? (
              <NoRoofTop setActiveItem={setActiveItem} />
            ) : (
              <>
                <RainfallStrip
                  month={lastMonthName}
                  rainfall={rainfall}
                  rainCaptured={roofRainCaptured}
                />
                <PDFReport />
              </>
            )}
          </div>

          {/* Profile */}
          <div className={activeItem === "profile" ? "block" : "hidden"}>
            <UserProfile />
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  );
};

export default Page;
