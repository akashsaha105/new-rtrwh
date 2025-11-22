"use client";

import React, { useEffect, useState } from "react";
import { BarChart2, Gauge } from "lucide-react";
import KeyStats from "./keyStats";
import Performance from "./performance";
import System from "./system";
import InstallNow from "./installNow";
import { onAuthStateChanged, Unsubscribe } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import HarvestedChart from "./HarvestedChart";
import SeasonalTrend from "./SeasonalTrend";
import Prediction from "./Prediction";

interface LastMonthRainfall {
  lastMonthRainfall: number; // Rainfall in mm
  // capturedLitres: number;
}
export function dimensionToLiters(dim: string): number {
  if (!dim) return 0;

  // Remove spaces and "m" characters
  const clean = dim.toLowerCase().replace(/m/g, "").replace(/\s/g, "");

  // Split by x or ×
  const parts = clean.split(/x|×/).map(Number);

  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error("Invalid dimension format. Use format like '2x2x2'");
  }

  const [l, w, h] = parts;

  const cubicMeters = l * w * h;
  const liters = cubicMeters * 1000;

  return liters;
}

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function sqftToM2(sqft: number): number {
  if (!sqft || sqft < 0) return 0;
  return sqft * 0.092903;
}

function parseDimensions(input: string) {
  if (!input) return { length: 0, width: 0, height: 0 };

  const clean = input.toLowerCase().replace(/\s+/g, "");
  const parts = clean.split("x");

  if (parts.length !== 3) return { length: 0, width: 0, height: 0 };

  const [l, w, h] = parts.map(Number);

  return {
    length: isNaN(l) ? 0 : l,
    width: isNaN(w) ? 0 : w,
    height: isNaN(h) ? 0 : h,
  };
}

interface BasicSystem {
  recharge: {
    dimension: string;
    sensorDistance: number;
    overflow: boolean;
    overflowReading: number;
    infiltrationRate?: number;
    // tankCapturedHeight: number;
    // rechargeCapturedHeight: number;
  };
  storage: {
    dimension: string;
    sensorDistance: number;
    overflow: boolean;
    overflowReading: number;
  };
}

interface rooftop {
  rooftop: {
    area: string;
    runOffCoefficient: string;
  };
}

const Insights = (LastMonthRainfall: LastMonthRainfall) => {
  const [status, setstatus] = useState<string>("inactive");
  // const [rainfall, setRainfall] = useState<number>(0);
  const [rooftopData, setRooftopData] = useState<rooftop>();
  const [area, setArea] = useState("");
  const [runOffCoefficient, setRunoffCoefficient] = useState("");

  // Tank Information
  const [tankSensorDistance, setTankSensorDistance] = useState<number>(0);
  const [tankDimension, setTankDimension] = useState<string>("");
  const [tankOverflow, setTankOverflow] = useState<boolean>(false);
  const [tankOverflowLoss, setTankOverflowLoss] = useState<number>(0);

  // Recharge Information
  const [rechargeOverflow, setRechargeOverflow] = useState<boolean>(false);
  const [rechargeOverflowLoss, setRechargeOverflowLoss] = useState<number>(0);
  const [rechargeSensorDistance, setRechargeSensorDistance] =
    useState<number>(0);
  const [rechargeDimension, setRechargeDimension] = useState<string>("");
  const [infiltrationRate, setInfiltrationRate] = useState<number>(0);

  // Standard Collection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // =================== Reference Document ===================
        const userDocRef = doc(firestore, "users", currentUser.uid);
        const standardDocRef = doc(firestore, "basic", currentUser.uid);

        // =================== Standard Document Snapshot ===================
        const standardUnsub: Unsubscribe = onSnapshot(
          standardDocRef,
          async (snapshot) => {
            if (!snapshot.exists()) return;

            try {
              const standardData = snapshot.data() as BasicSystem;

              // Storage Tank
              setTankDimension(standardData.storage.dimension);
              setTankSensorDistance(standardData.storage.sensorDistance);
              setTankOverflow(Boolean(standardData.storage.overflow));

              // Recharge Pit
              setRechargeDimension(standardData.recharge.dimension);
              setRechargeSensorDistance(
                standardData.recharge.sensorDistance
              );
              setRechargeOverflow(Boolean(standardData.recharge.overflow));
              setInfiltrationRate(
                standardData.recharge.infiltrationRate ?? 0
              );

              await setDoc(
                standardDocRef,
                {
                  storage: {
                    overflow:
                      standardData.storage.sensorDistance === 0 ? true : false,
                  },
                  recharge: {
                    overflow:
                      standardData.recharge.sensorDistance === 0 ? true : false,
                  },
                },

                { merge: true }
              );

              // Storage Tank Overflow
              setTankOverflow(
                standardData.storage.sensorDistance === 0 ? true : false
              );

              // Recharge Overflow
              setRechargeOverflow(
                standardData.recharge.sensorDistance === 0 ? true : false
              );
              setInfiltrationRate(standardData.recharge.infiltrationRate ?? 0);

              // Storage and Recharge Pit Overflow Portion
              if (standardData.storage.overflow) {
                setTankOverflowLoss(standardData.storage.overflowReading);
              }

              if (standardData.recharge.overflow) {
                setRechargeOverflowLoss(standardData.recharge.overflowReading);
              }
              // return () => userSnapshot;
            } catch (e) {
              console.log(e);
            }
          }
        );

        // =================== User Document Snapshot ===================
        const userSnapshot = onSnapshot(userDocRef, async (snapshot) => {
          if (!snapshot.exists()) return;

          try {
            const monthName = new Date().toLocaleString("en-IN", {
              month: "long",
            });
            const userData = snapshot.data();
            const rooftopData = userData as rooftop;
            setRooftopData(rooftopData);
            setArea(rooftopData.rooftop.area);
            setRunoffCoefficient(rooftopData.rooftop.runOffCoefficient);

            // const data = snapshot.data();
            // setRainfall(data.rainfall);
            // const capturedLitres =
            //   Math.round(
            //     sqftToM2(Number(rooftopData.rooftop.area)) *
            //       LastMonthRainfall.lastMonthRainfall
            //   ) * Number(rooftopData.rooftop.runOffCoefficient);

            await setDoc(
              standardDocRef,
              {
                month: {
                  [monthName]: {
                    rainfall: Math.round(
                      sqftToM2(Number(area)) *
                        LastMonthRainfall.lastMonthRainfall
                    ),
                    harvested:
                      Math.round(
                        sqftToM2(Number(area)) *
                          LastMonthRainfall.lastMonthRainfall
                      ) * Number(runOffCoefficient),
                  },
                },
              },
              { merge: true }
            );
          } catch (e) {
            console.log(e);
          }
        });

        return () => {
          standardUnsub()
          userSnapshot();
        };
      }
    });
    return () => unsubscribe();
  }, []);




  // ========================= From Here Main Calculation Starts =========================
  const roofRainCaptured = sqftToM2(Number(area))
  * Number(runOffCoefficient)
  * mmToM(LastMonthRainfall.lastMonthRainfall) * 1000;  
  
  
  // Parsing the dimensions
  const storageDims = parseDimensions(tankDimension);
  const rechargeDims = parseDimensions(rechargeDimension);



  //  Storage Tank Calculations
  const tank_utilization = ((storageDims.height - tankSensorDistance) / storageDims.height) * 100
  const tank_water_liters = storageDims.length * storageDims.width * (storageDims.height - tankSensorDistance) * 1000;
  // const tank_overflow_loss = dimensionToLiters(tankDimension) - roofRainCaptured;
  const storage_efficiency = (tankSensorDistance / storageDims.height) * 100;




  // Ground Recharge Calculations
  const recharge_utilization = ((rechargeDims.height - rechargeSensorDistance) / rechargeDims.height) * 100 ;
  const recharge_water_liters = rechargeDims.length * rechargeDims.width * (rechargeDims.height - rechargeSensorDistance) * 1000;
  const recharge_efficiency =
    (rechargeSensorDistance / rechargeDims.height) * 100;
  // const recharge_overflow_loss =
  //   roofRainCaptured - dimensionToLiters(rechargeDimension);
  // const recharge_efficiency =
  //   ((roofRainCaptured - recharge_overflow_loss) /
  //     dimensionToLiters(rechargeDimension)) *
  //   100;

  const rainHarvested = tank_water_liters + recharge_water_liters;
  const total_system_efficiency =
    (storage_efficiency + recharge_efficiency) / 2;
  const total_overflow_loss = tankOverflowLoss + rechargeOverflowLoss;

  // Dummy Data
  // const monthlyPerformance = [
  //   { month: "Jan", rainfall: 320, harvested: 250 },
  //   { month: "Feb", rainfall: 280, harvested: 210 },
  //   { month: "Mar", rainfall: 400, harvested: 320 },
  //   { month: "Apr", rainfall: 600, harvested: 480 },
  //   { month: "May", rainfall: 720, harvested: 600 },
  //   { month: "Jun", rainfall: 950, harvested: 820 },
  //   { month: "Jul", rainfall: 880, harvested: 700 },
  //   { month: "Aug", rainfall: 790, harvested: 680 },
  //   { month: "Sep", rainfall: 610, harvested: 500 },
  //   { month: "Oct", rainfall: 450, harvested: 360 },
  //   { month: "Nov", rainfall: 320, harvested: 260 },
  //   { month: "Dec", rainfall: 200, harvested: 160 },
  // ];

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [monthlyPerformance, setMonthlyPerformance] = useState<
    { month: string; rainfall: number; harvested: number }[]
  >([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;

      const docRef = doc(firestore, "users", currentUser.uid);

      const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
        if (!snapshot.exists()) {
          console.log("No data found");
          setMonthlyPerformance([]); // reset safely
          return;
        }

        try {
          const data = snapshot.data();
          const savedMonths = data.active?.month || {};

          // Build final monthly array
          const finalData = MONTHS.map((fullMonth, index) => {
            const rec = savedMonths[fullMonth] ?? null;

            return {
              month: SHORT[index],
              rainfall: rec?.rainfall ?? 0,
              harvested: rec?.harvested ?? 0,
            };
          });

          setMonthlyPerformance(finalData);
        } catch (err) {
          console.log("Error parsing Firestore data:", err);
        }
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser.uid);

        const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            try {
              const data = snapshot.data();
              setstatus(data.status);
            } catch (e) {
              console.log(e);
            }
          } else {
            console.log("No Data found");
          }
        });

        return () => unsubscribeSnapshot(); // cleanup snapshot
      }
    });

    return () => unsubscribe(); // cleanup auth
  }, []);

  // Get last month name
  const date = new Date();
  const lastMonthIndex = (date.getMonth() - 1 + 12) % 12;
  const lastMonthName = new Date(
    date.getFullYear(),
    lastMonthIndex
  ).toLocaleString("en-IN", {
    month: "long",
  });

  // const capturedLitres = rooftopData?.rooftop.area || 0 * rooftopData?.rooftop.runOffCoefficient * LastMonthRainfall.lastMonthRainfall;
  return (
    <>
      <div>
        {/* <div className="w-full bg-white/10 border border-white/20 p-4 text-white text-sm font-medium">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-teal-300">{lastMonthName} Rainfall</div>
              <div className="text-xl font-semibold">
                {LastMonthRainfall.lastMonthRainfall.toFixed(2)} mm
              </div>
            </div>

            <div className="h-full w-px bg-white/20 mx-4"></div>

            <div>
              <div className="text-teal-300">Total Captured</div>
              <div className="text-xl font-semibold">
                {roofRainCaptured.toLocaleString()} L
              </div>
            </div>
          </div>
        </div> */}
        <div className=" p-8 min-h-screen text-white">
          {/* Page Header */}
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <BarChart2 className="h-8 w-8 text-green-400" />
            Rainwater Harvesting Insights
          </h2>

          {/* Key Stats */}
          <KeyStats
            rainCaptured={status == "inactive" || status == "processing" ? "--- " : rainHarvested.toLocaleString()}
            tankUtilization={status == "inactive" || status == "processing" ? "--- " : tank_utilization.toFixed(2)}
            tankWaterLiters={status == "inactive" || status == "processing" ? "--- " : tank_water_liters.toLocaleString()}
            groundWaterRecharge={status == "inactive" || status == "processing" ? "--- " : recharge_utilization.toFixed(2)}
            rechargeWaterLiters={status == "inactive" || status == "processing" ? "--- " : Math.round(recharge_water_liters)}
          />

          {/* Recommendation for Storage Tank */}
          <System
            tankCapacity={status == "inactive" || status == "processing" ? "--- " : dimensionToLiters(tankDimension)}
            tankOverflowLoss={status == "inactive" || status == "processing" ? "--- " : String(Math.round(Number(tankOverflowLoss)))}
            tankOverflow={status == "inactive" || status == "processing" ? "--- " : tankOverflow}
            tankUtilization={status == "inactive" || status == "processing" ? "--- " : Math.round(tank_utilization)}
            tankEfficiency={status == "inactive" || status == "processing" ? "--- " : Math.round(storage_efficiency)}
            rechargeCapacity={status == "inactive" || status == "processing" ? "--- " : dimensionToLiters(rechargeDimension)}
            rechargeOverflowRisk={status == "inactive" || status == "processing" ? "--- " : rechargeOverflowLoss}
            rechargeOverflow={status == "inactive" || status == "processing" ? "--- " : rechargeOverflow}
            rechargeEfficiency={status == "inactive" || status == "processing" ? "--- " : Math.round(recharge_efficiency)}
            rechargeInfiltrationRate={status == "inactive" || status == "processing" ? "--- " : String(infiltrationRate)}
          />

          {/* Performance Insights */}
          <div className="mt-8 min-h-screen text-white">
            {/* Page Header */}
            <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
              <Gauge className="h-8 w-8 text-emerald-400" />
              Overall Performance Insights
            </h2>

            {/* Key Performance Stats */}
            <Performance
              systemEfficiency={status == "inactive" || status == "processing" ? "--- " : Math.round(total_system_efficiency)}
              overflowLoss={status == "inactive" || status == "processing" ? "--- " : total_overflow_loss}
            />

            {/* Rainfall vs Harvested Water */}
            <HarvestedChart data={monthlyPerformance} />

            {/* Seasonal Trend */}
            <SeasonalTrend data={monthlyPerformance} />
          </div>

          {/* Predictions & Recommendations */}
          {/* <Prediction
            harvested={Math.round(rainHarvested)}
            tankUtilization={Math.round(tank_utilization)}
            rechargeUtilization={Math.round(recharge_utilization)}
            storageEfficiency={Math.round(storage_efficiency)}
            rechargeEfficiency={Math.round(recharge_efficiency)}
            overflowLoss={Math.round(total_overflow_loss)}
            infiltrationRate={infiltrationRate}
            rainfall={rainfall}
          /> */}
          <Prediction />
        </div>
      </div>
      {status.toLowerCase() == "inactive" || status.toLowerCase() == "processing" ? <InstallNow /> : ""}
    </>
  );
};

export default Insights;
