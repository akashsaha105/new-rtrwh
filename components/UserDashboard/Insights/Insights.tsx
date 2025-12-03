"use client";

import React, { useEffect, useState } from "react";
import { BarChart2, Gauge } from "lucide-react";
import KeyStats from "./keyStats";
import Performance from "./performance";
import System from "./system";
import InstallNow from "./installNow";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import HarvestedChart from "./HarvestedChart";
import SeasonalTrend from "./SeasonalTrend";
import Prediction from "./Prediction";
import MaintenanceCard from "../Install/MaintenanceCard";

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
  const [user, setUser] = useState<User | null>();
  /* ---- STATES ---- */
  const [status, setStatus] = useState("inactive");

  // user + standard
  const [rooftop, setRooftop] = useState<rooftop | null>(null);

  // storage tank
  const [tankDim, setTankDim] = useState("");
  const [tankSD, setTankSD] = useState(0);
  const [tankOverflow, setTankOverflow] = useState(false);
  const [tankOverflowRisk, setTankOverflowRisk] = useState(0);

  // recharge pit
  const [recDim, setRecDim] = useState("");
  const [recSD, setRecSD] = useState(0);
  const [recOverflow, setRecOverflow] = useState(false);
  const [recOverflowRisk, setRecOverflowRisk] = useState(0);
  const [infiltrationRate, setInfiltrationRate] = useState(0);

  const [monthlyPerformance, setMonthlyPerformance] = useState<
    { month: string; rainfall: number; harvested: number }[]
  >([]);

  /* ===========================================================
      FIRESTORE LISTENERS — FIXED
  ============================================================ */

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      setUser(user);
      const userRef = doc(firestore, "users", user.uid);
      const stdRef = doc(firestore, "standard", user.uid);

      /* ----- USER SNAPSHOT ----- */
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setStatus(data.status || "inactive");
        setRooftop(data as rooftop);

        // monthly performance
        const months = [
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
        const short = [
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

        const saved = data.active?.month || {};
        const arr = months.map((m, i) => ({
          month: short[i],
          rainfall: saved[m]?.rainfall ?? 0,
          harvested: saved[m]?.harvested ?? 0,
        }));

        setMonthlyPerformance(arr);
      });

      /* ----- STANDARD SNAPSHOT ----- */
      const unsubStd = onSnapshot(stdRef, (snap) => {
        if (!snap.exists()) return;
        const sys = snap.data() as BasicSystem;

        setTankDim(sys.storage.dimension);
        setTankSD(sys.storage.sensorDistance);
        setTankOverflow(sys.storage.overflow);
        setTankOverflowRisk(sys.storage.overflowReading || 0);

        setRecDim(sys.recharge.dimension);
        setRecSD(sys.recharge.sensorDistance);
        setRecOverflow(sys.recharge.overflow);
        setRecOverflowRisk(sys.recharge.overflowReading || 0);
        setInfiltrationRate(sys.recharge.infiltrationRate || 0);
      });

      return () => {
        unsubUser();
        unsubStd();
      };
    });

    return () => unsubAuth();
  }, []);

  /* ===========================================================
      CALCULATIONS — FIXED + SAFE
  ============================================================ */

  const area = Number(rooftop?.rooftop.area || 0);
  const C = Number(rooftop?.rooftop.runOffCoefficient || 0);

  const roofRainCaptured =
    sqftToM2(area) * C * LastMonthRainfall.lastMonthRainfall;

  const sd = parseDimensions(tankDim);
  const rd = parseDimensions(recDim);

  const tankWater =
    sd.length * sd.width * Math.max(0, sd.height - tankSD) * 1000;

  const tankRemaining = dimensionToLiters(tankDim) - tankWater;

  const tankUtilization =
    sd.height > 0 ? ((sd.height - tankSD) / sd.height) * 100 : 0;

  const tankEfficiency = sd.height > 0 ? (tankSD / sd.height) * 100 : 0;

  const tankRisk =
    tankRemaining > 0
      ? (dimensionToLiters(tankDim) / tankRemaining) * 100
      : 100;

  const recWater = rd.length * rd.width * Math.max(0, rd.height - recSD) * 1000;

  const recUtil = rd.height > 0 ? ((rd.height - recSD) / rd.height) * 100 : 0;

  const recEfficiency = rd.height > 0 ? (recSD / rd.height) * 100 : 0;

  const totalHarvested = tankWater + recWater;

  const totalEfficiency = (tankEfficiency + recEfficiency) / 2;

  const totalLoss = tankOverflowRisk + recOverflowRisk;

  function calculateIndividualOverflowRisk(params: {
    areaSqft: number;
    rainfallMM: number;
    runoff: number;

    tankDimension: string;
    tankSensorDistance: number;

    rechargeDimension: string;
    rechargeSensorDistance: number;

    infiltrationRateMM: number; // mm/hr
    rainfallDurationHr?: number; // default = 1
  }) {
    const {
      areaSqft,
      rainfallMM,
      runoff,

      tankDimension,
      tankSensorDistance,

      rechargeDimension,
      rechargeSensorDistance,

      infiltrationRateMM,
      rainfallDurationHr = 1,
    } = params;

    // ------------------- helpers -------------------
    const td = parseDimensions(tankDimension);
    const rd = parseDimensions(rechargeDimension);

    /* ------------------- incoming runoff ------------------- */
    const roofAreaM2 = sqftToM2(areaSqft);
    const incomingLiters = roofAreaM2 * rainfallMM * runoff;

    /* ========================================================
     TANK CALCULATION
  ======================================================== */
    // const tankGross = dimensionToLiters(tankDimension);
    // const tankCurrent = tankUtilization;
    // const tankCurrent =
    //   td.length * td.length * Math.max(0, td.height - tankSensorDistance) * 1000;

    const tankAvailable = tankRemaining;

    const tankOverflowLiters = incomingLiters - tankAvailable;

    const tankRiskPercent =
      incomingLiters === 0
        ? 0
        : Math.min(
            100,
            Math.max(0, (tankOverflowLiters / incomingLiters) * 100)
          );

    /* ========================================================
     RECHARGE PIT CALCULATION
  ======================================================== */
    const r = parseDimensions(rechargeDimension);

    const voidFraction = 0.4;
    const usableH = Math.max(0, rd.height - rechargeSensorDistance);

    const rechargeStorageLiters =
      rd.length * rd.width * usableH * voidFraction * 1000;

    // infiltration capacity
    const infiltrationRateM = mmToM(infiltrationRateMM);
    const Aeff = rd.length * rd.width + 2 * rd.height * (rd.length + rd.width);

    const infiltrationLiters =
      infiltrationRateM * Aeff * rainfallDurationHr * 1000;

    const rechargeCapacity = rechargeStorageLiters + infiltrationLiters;

    const rechargeOverflowLiters = Math.max(
      0,
      incomingLiters - rechargeCapacity
    );

    const rechargeRiskPercent =
      incomingLiters === 0
        ? 0
        : Math.min(
            100,
            Math.max(0, (rechargeOverflowLiters / incomingLiters) * 100)
          );

    /* ------------------- return result ------------------- */
    return {
      incomingLiters,

      tankRiskPercent,
      tankOverflowLiters,

      rechargeRiskPercent,
      rechargeOverflowLiters,
    };
  }

  const risk = calculateIndividualOverflowRisk({
    areaSqft: Number(area),
    rainfallMM: LastMonthRainfall.lastMonthRainfall,
    runoff: Number(rooftop?.rooftop.runOffCoefficient),

    tankDimension: tankDim,
    tankSensorDistance: tankSD,

    rechargeDimension: recDim,
    rechargeSensorDistance: recSD,

    infiltrationRateMM: 25,
  });

  function calculateTotalOverflowRisk() {
    // 1) Incoming runoff from roof
    const roofAreaM2 = sqftToM2(area);
    const incomingLiters = roofAreaM2 * LastMonthRainfall.lastMonthRainfall * C;

    // 2) Tank available storage
    const tankGross = dimensionToLiters(tankDim);
    const tankAvailable = Math.max(0, tankGross - tankWater);

    // 3) Recharge pit storage (void volume)
    const voidFraction = 0.4; // 40% voids
    const usableRechargeHeight = Math.max(0, rd.height - recSD);
    const rechargeVoidLiters =
      rd.length * rd.width * usableRechargeHeight * voidFraction * 1000;

    // 4) Infiltration capacity during rainfall (1 hour default)
    const rainfallDurationHr = 1;
    const infiltrationRateM = mmToM(infiltrationRate); // convert mm/hr → m/hr

    // Effective recharge area (base + sides)
    const Aeff = rd.length * rd.width + 2 * rd.height * (rd.length + rd.width);

    const infiltrationLiters =
      infiltrationRateM * Aeff * rainfallDurationHr * 1000;

    // 5) Total system capacity
    const systemCapacity =
      tankAvailable + rechargeVoidLiters + infiltrationLiters;

    // 6) Overflow amount
    const overflowLiters = Math.max(0, incomingLiters - systemCapacity);

    // 7) Overflow percentage
    const riskPercent =
      incomingLiters === 0
        ? 0
        : Math.min(100, Math.max(0, (overflowLiters / incomingLiters) * 100));

    return {
      incomingLiters,
      systemCapacity,
      overflowLiters,
      riskPercent,
    };
  }

  const totalOverflowRiskData = calculateTotalOverflowRisk();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      const userDoc = doc(firestore, "users", currentUser.uid);
      const standardDoc = doc(firestore, "standard", currentUser.uid);

      const userSnap = onSnapshot(userDoc, async (snapshot) => {
        if (!snapshot.exists()) return;

        try {
          const data = snapshot.data();

          if (data.status != "inactive") {
            const monthName = new Date().toLocaleString("en-US", {
              month: "long",
            });
            await setDoc(
              standardDoc,
              {
                monthlyPerformance: {
                  [monthName]: {
                    rainfall: roofRainCaptured,
                    harvested: totalHarvested,
                  },
                },
              },
              { merge: true }
            );
          }
        } catch (e) {
          console.log(e);
        }
      });
    });
    return () => unsub();
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const userDoc = doc(firestore, "users", user.uid);
      const standardDoc = doc(firestore, "standard", user.uid);

      const unsubscribe = onSnapshot(userDoc, async (snapshot) => {
        if (!snapshot.exists()) return;

        try {
          const data = snapshot.data();

          if (data.status === "inactive") {
            // monthly performance
            const months = [
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

            const short = [
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

            // 🔥 FIX: Your schema is data.monthlyCollected (NOT data.active.monthlyCollected)
            const saved = data.monthlyCollected || {};

            const arr = months.map((m, i) => ({
              month: short[i],
              rainfall: saved[m]?.rainfall ?? 0,
              harvested: saved[m]?.harvested ?? 0,
            }));

            setMonthlyPerformance(arr);
          } else {
            // const now = new Date();
            // const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            // const prevMonthName = prev.toLocaleString("en-US", {
            //   month: "long",
            // });

            const standSnap = onSnapshot(standardDoc, async (snapshot) => {
              if (!snapshot.exists()) return;
              try {
                const standardData = snapshot.data();

                const months = [
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

                const short = [
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

                const saved =
                  (standardData && standardData.monthlyPerformance) || {};

                const arr = months.map((m, i) => ({
                  month: short[i],
                  rainfall: saved[m]?.rainfall ?? 0,
                  harvested: Number(saved[m]?.harvested) ?? 0,
                }));

                setMonthlyPerformance(arr);
              } catch (e) {
                console.log(e);
              }
            });

            return () => standSnap();
          }
        } catch (e) {
          console.error("Error reading monthly performance:", e);
        }
      });

      return () => unsubscribe();
    });

    return () => unsub();
  }, []);

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
            rainCaptured={
              status == "inactive" || status == "processing"
                ? "--- "
                : totalHarvested.toLocaleString()
            }
            tankUtilization={
              status == "inactive" || status == "processing"
                ? "--- "
                : tankUtilization.toFixed(2)
            }
            tankWaterLiters={
              status == "inactive" || status == "processing"
                ? "--- "
                : tankWater.toLocaleString()
            }
            groundWaterRecharge={
              status == "inactive" || status == "processing"
                ? "--- "
                : recUtil.toFixed(2)
            }
            rechargeWaterLiters={
              status == "inactive" || status == "processing"
                ? "--- "
                : Math.round(recWater)
            }
          />

          {/* Recommendation for Storage Tank */}
          <System
            tankDimension={
              status == "inactive" || status == "processing"
                ? "--- "
                : `${sd.length}m x ${sd.width}m x ${sd.height}m`
            }
            tankCapacity={
              status == "inactive" || status == "processing"
                ? "--- "
                : dimensionToLiters(tankDim)
            }
            tankremainingCapacity={
              status == "inactive" || status == "processing"
                ? "---"
                : tankRemaining.toLocaleString()
            }
            tankOverflowRisk={
              status == "inactive" || status == "processing"
                ? "--- "
                : String(Math.round(Number(risk.tankRiskPercent)))
            }
            tankOverflow={
              status == "inactive" || status == "processing"
                ? "--- "
                : tankOverflow
            }
            tankUtilization={
              status == "inactive" || status == "processing"
                ? "--- "
                : Math.round(tankUtilization)
            }
            tankEfficiency={
              status == "inactive" || status == "processing"
                ? "--- "
                : Math.round(tankEfficiency)
            }
            rechargeDimension={
              status == "inactive" || status == "processing"
                ? "--- "
                : `${rd.length}m x ${rd.width}m x ${rd.height}m`
            }
            rechargeCapacity={
              status == "inactive" || status == "processing"
                ? "--- "
                : dimensionToLiters(recDim)
            }
            rechargeOverflowRisk={
              status == "inactive" || status == "processing"
                ? "--- "
                : risk.rechargeRiskPercent
            }
            rechargeOverflow={
              status == "inactive" || status == "processing"
                ? "--- "
                : recOverflow
            }
            rechargeEfficiency={
              status == "inactive" || status == "processing"
                ? "--- "
                : Math.round(recEfficiency)
            }
            rechargeInfiltrationRate={
              status == "inactive" || status == "processing"
                ? "--- "
                : String(infiltrationRate)
            }
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
              systemEfficiency={
                status == "inactive" || status == "processing"
                  ? "--- "
                  : Math.round(totalEfficiency)
              }
              overflowRisk={
                status == "inactive" || status == "processing"
                  ? "---"
                  : Math.round(totalOverflowRiskData.riskPercent)
              }
              overflowLoss={
                status == "inactive" || status == "processing"
                  ? "--- "
                  : totalLoss
              }
            />

            {/* Rainfall vs Harvested Water */}
            <HarvestedChart data={monthlyPerformance} />

            {/* Seasonal Trend */}
            <SeasonalTrend data={monthlyPerformance} />
          </div>

          <div>
            {/* <MaintenanceCard /> */}
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
      {status.toLowerCase() == "inactive" ||
      status.toLowerCase() == "processing" ? (
        <InstallNow />
      ) : (
        ""
      )}
    </>
  );
};

export default Insights;
