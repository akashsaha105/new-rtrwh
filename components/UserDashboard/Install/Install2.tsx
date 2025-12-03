/* eslint-disable @next/next/no-img-element */
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import StatusCard from "../StatusCard";
import RecommendedProducts from "./RecommendedProducts";
import InstallType from "./InstallType2";
import StandardStatusForm from "./StandardStatusForm";
import { doc, getDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import ProStatusForm from "./ProStatusForm";
import MaintenanceModernCompact from "./MaintenanceCard";
import UserOrders from "./UserOrders";

// ====================== Annual Savings Calculator ======================
const calculateAnnualSavings = (roofArea: number) => {
  const RAINFALL_MM = 800;
  const EFFICIENCY = 0.8;
  const WATER_TARIFF = 0.02;

  const annualWaterLitres = roofArea * RAINFALL_MM * EFFICIENCY;
  const annualSavings = annualWaterLitres * WATER_TARIFF;

  return Math.floor(annualSavings);
};

const InstallPage: React.FC = () => {
  const [activePlan, setActivePlan] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const [mode, setMode] = useState("free"); // ⭐ NEW — track user mode

  const [standardPrice, setStandardPrice] = useState<number | null>(null);
  const [proPrice, setProPrice] = useState<number | null>(null);

  const [userId, setUserId] = useState("");
  const [annualSavings, setAnnualSavings] = useState<number | null>(null);

  const slideVariants = {
    enter: {
      x: "100%", // coming from right
      opacity: 1,
    },
    center: {
      x: 0, // centered
      opacity: 1,
    },
    exit: {
      x: "-100%", // leaving left
      opacity: 0.8,
    },
  };

  const handleToggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra)
        ? prev.filter((item) => item !== extra)
        : [...prev, extra]
    );
  };

  // Fetch rooftop details from Firebase
  useEffect(() => {
    const fetchRooftop = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setUserId(user.uid);
      const ref = doc(firestore, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const rooftop = data.rooftop;

        if (rooftop) {
          const area = parseInt(rooftop.area || "0");
          const dwellers = parseInt(rooftop.dwellers || "0");
          const space = parseInt(rooftop.space || "0");

          let baseStandard = 20000;
          let basePro = 40000;

          if (area > 500 && area <= 1000) baseStandard += 3000;
          if (area > 1000) baseStandard += 7000;

          if (area > 500 && area <= 1000) basePro += 5000;
          if (area > 1000) basePro += 10000;

          if (space < 300) {
            baseStandard += 2000;
            basePro += 3000;
          }

          if (dwellers >= 6) {
            baseStandard += 3000;
            basePro += 5000;
          }

          setStandardPrice(baseStandard);
          setProPrice(basePro);
        }
      }
    };

    fetchRooftop();
  }, []);

  // Fetch user details (status + mode + savings)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(firestore, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          // ⭐ NEW — read mode
          setMode(userData.mode || "free");

          // Keep older status system for compatibility
          setStatus(userData.status || "");

          const roof = userData.rooftop;
          if (roof?.area) {
            const areaNum = parseFloat(roof.area);
            const savings = calculateAnnualSavings(areaNum);
            setAnnualSavings(savings);
          }
        } else {
          console.log("No such user document!");
        }
      } else {
        setMode("free");
        setStatus("");
        setAnnualSavings(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {activePlan === "standard" ? (
          <motion.div
            key="standard"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <StandardStatusForm />
          </motion.div>
        ) : activePlan == "pro" ? (
          <>
            <motion.div
              key="standard"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <ProStatusForm />
            </motion.div>
          </>
        ) : (
          <div className="relative space-y-6 p-8">
            {/* Title */}
            <h3
              className="text-3xl font-bold text-sky-300"
              id="installation-overview"
              data-tab="install"
            >
              Installation Overview
            </h3>

            {status === "inactive" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h4 className="text-lg font-semibold text-sky-200 mb-3">
                      Installation Cost
                    </h4>
                    <p className="text-3xl font-bold text-white">
                      ₹ {standardPrice} – ₹ {proPrice}
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      Based on Standard vs Pro package.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h4 className="text-lg font-semibold text-green-300 mb-3">
                      Annual Savings
                    </h4>
                    <p className="text-3xl font-bold text-green-400">
                      ₹{" "}
                      {annualSavings !== null
                        ? annualSavings
                        : "Calculating..."}
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      Reduced water bills and recharge benefits.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              ""
            )}
            {status !== "inactive" && (
              <>
                {/* ===== OTHER STATUSES ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <StatusCard status={status} setStatus={setStatus} />
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h4 className="text-lg font-semibold text-green-300 mb-3">
                      Annual Savings
                    </h4>
                    <p className="text-3xl font-bold text-green-400">
                      ₹{" "}
                      {annualSavings !== null
                        ? annualSavings
                        : "Calculating..."}
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      Reduced water bills and recharge benefits.
                    </p>
                  </div>
                </div>
              </>
            )}
            {/* ====================== CONDITIONAL UI BY MODE ====================== */}
            {["inactive", "standard"].includes(status) && ["free", "standard", "pro"].includes(mode) && (
                <>
                  {/* ===== FIRST LAYOUT ===== */}

                  <InstallType
                    standardPrice={standardPrice}
                    proPrice={proPrice}
                    standardButton={
                      <>
                        <button
                          // onClick={() => activateStandardPlan()}
                          onClick={() =>
                            mode == "standard" || mode == "pro"
                              ? ""
                              : setActivePlan("standard")
                          }
                          className={`mt-6 w-full py-2 rounded-lg text-white font-semibold transition  ${
                            mode == "standard" || mode == "pro"
                              ? "bg-sky-900 cursor-not-allowed"
                              : "bg-sky-600 hover:bg-sky-700 cursor-pointer"
                          }`}
                        >
                          {["standard", "pro"].includes(mode)
                            ? "Your system is now in processing mode"
                            : "Get Standard Plan"}
                        </button>
                      </>
                    }
                    proButton={
                      <>
                        <button
                          onClick={() =>
                          ["standard", "pro"].includes(mode) && ["inactive", "standard"].includes(status)
                              ? ""
                              : setActivePlan("pro")
                          }
                          className={`mt-6 w-full py-2 rounded-lg text-white font-semibold transition ${
                            ["standard", "pro"].includes(mode) && ["inactive", "standard"].includes(status)
                              ? "bg-purple-900 cursor-not-allowed"
                              : "bg-purple-600 hover:bg-purple-700 cursor-pointer"
                          }`}
                        >
                          {(mode == "standard" || mode == "pro") && (status === "inactive" || status === "standard")
                            ? "Your system is now in processing mode"
                            : status === "standard" ? "Switch to Pro mode" : "Get Pro Plan"}
                        </button>
                      </>
                    }
                  />
                </>
              )}
            {status === "standard" || status === "pro" ? (
              <MaintenanceModernCompact />
            ) : (
              ""
            )}

            {/* Recommended Products */}
            <RecommendedProducts />

            {/* ================= Additional Items ================= */}
            <div>
              <h3 className="text-2xl font-bold text-green-300 mb-6">
                ➕ Additional Items
              </h3>

              {/* Toggle Chips */}
              <div className="flex flex-wrap gap-4">
                {[
                  "Gutter Pipes",
                  "First Flush Diverter",
                  "Recharge Pit Rings",
                  "Overflow Pipe",
                  "pH Sensor",
                  "Water Quality Tester",
                ].map((extra, i) => (
                  <span
                    key={i}
                    onClick={() => handleToggleExtra(extra)}
                    className={`px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-gray-200 shadow transition cursor-pointer ${
                      selectedExtras.includes(extra)
                        ? "ring-2 ring-green-400 bg-green-700/40"
                        : ""
                    }`}
                  >
                    {extra}
                  </span>
                ))}
              </div>

              {/* Show cards only if items are selected */}
              {selectedExtras.length > 0 && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {[
                      {
                        name: "Gutter Pipes",
                        price: "₹ 1,200",
                        desc: "High-quality PVC pipes for rooftop collection.",
                        tag: "Durable",
                        img: "https://www.supreme.co.in/uploads/images/ZFg7H5UhK4IWr4KFx21nsHVHfHiVDZ63EbE1v5PN.jpg",
                      },
                      {
                        name: "First Flush Diverter",
                        price: "₹ 1,000",
                        desc: "Ensures clean water by discarding first rainwater.",
                        tag: "Must Have",
                        img: "https://store.bmigroup.com/medias/Product-Hero-Small-Desktop-Tablet-IMG-0049.jpg",
                      },
                      {
                        name: "Recharge Pit Rings",
                        price: "₹ 3,500",
                        desc: "Concrete rings for effective groundwater recharge.",
                        tag: "Eco Friendly",
                        img: "https://urbanwaters.in/wp-content/uploads/2022/03/230720091404.jpg",
                      },
                      {
                        name: "Overflow Pipe",
                        price: "₹ 600",
                        desc: "Safely channels excess water away from tanks.",
                        tag: "Safety",
                        img: "https://m.media-amazon.com/images/I/81umNTvyGyL.jpg",
                      },
                      {
                        name: "pH Sensor",
                        price: "₹ 2,800",
                        desc: "Measures acidity/alkalinity of water in real time.",
                        tag: "Smart",
                        img: "https://5.imimg.com/data5/KC/XY/ME/SELLER-4167793/ph-sensor-kit.jpg",
                      },
                      {
                        name: "Water Quality Tester",
                        price: "₹ 4,500",
                        desc: "Portable tester for water safety and purity checks.",
                        tag: "Premium",
                        img: "https://m.media-amazon.com/images/I/713vJhqz1nL.jpg",
                      },
                    ]
                      .filter((item) => selectedExtras.includes(item.name))
                      .map((item, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-br from-indigo-900/40 to-sky-800/30 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg hover:shadow-2xl transition cursor-pointer"
                        >
                          <div className="relative w-full h-40 mb-5">
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <span className="absolute top-3 left-3 text-xs text-white bg-pink-600/80 px-2 py-1 rounded-md shadow-md">
                              {item.tag}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-white">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-gray-300 text-sm">{item.desc}</p>
                          <p className="text-xl font-bold text-sky-300 mt-3">
                            {item.price}
                          </p>
                          <button className="mt-4 w-full py-2 rounded-lg border-2 border-sky-600 hover:bg-sky-700 text-white font-semibold transition cursor-pointer">
                            View Details
                          </button>
                          <button className="mt-4 w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition cursor-pointer">
                            Buy Now
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            {status === "standard" || status === "pro" ? (
              <UserOrders userId={userId} />
            ) : (
              ""
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstallPage;
