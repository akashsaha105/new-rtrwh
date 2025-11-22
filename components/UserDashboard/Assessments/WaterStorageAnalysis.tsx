import { useTranslations } from "next-intl";
import React from "react";

interface Props {
  roofRainCaptured: number;
  harvestPotential: number;
  percentage: number;
}

export default function WaterStorageAnalysis({
  roofRainCaptured,
  harvestPotential,
  percentage,
}: Props) {
  const t = useTranslations("assessment");

  // Ring constants
  const RADIUS = 40;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // SAFE PERCENT (prevents NaN)
  const percent = Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold mb-4 text-indigo-400" id="harvest_1">
        {t("rainwaterHarvestAnalysis")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ================================================== */}
        {/* 1️⃣ Rain Collected */}
        {/* ================================================== */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/70 to-slate-900/80 border border-indigo-700/70 shadow-xl group relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-10 transition"></div>

          <div className="flex items-center justify-between gap-6">
            {/* Text Column */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-indigo-300">
                {t("rainCollected")}
              </h3>

              <p className="text-3xl font-bold mt-2 text-indigo-400 drop-shadow-md">
                {Math.round(roofRainCaptured).toLocaleString()} Liters
              </p>

              <p className="text-sm text-indigo-200/70 mt-1">
                Practical estimate before considering roof runoff efficiency.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 2️⃣ Total Harvest Potential */}
        {/* ================================================== */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-900/70 to-slate-900/80 border border-teal-700/70 shadow-xl group relative overflow-hidden">
          <div className="absolute inset-0 bg-teal-500/10 blur-3xl opacity-0 group-hover:opacity-10 transition"></div>

          <div className="flex items-center justify-between gap-6">
            {/* Text Column */}
            <div className="flex-1">
              <h3
                className="text-lg font-semibold text-teal-300"
                id="harvest_2"
              >
                {t("totalHarvestPotential")}
              </h3>

              <p className="text-3xl font-bold mt-2 text-teal-400 drop-shadow-md">
                {Math.round(harvestPotential).toLocaleString()} Liters
              </p>

              <p className="text-sm text-teal-200/70 mt-1">
                Maximum annual rooftop capture based on rainfall & roof size.
              </p>
            </div>

            {/* Ring Column */}
            <div className="w-28 h-28 relative flex justify-center">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle
                  cx="56"
                  cy="56"
                  r={RADIUS}
                  stroke="#3f3f46"
                  strokeWidth="8"
                  fill="transparent"
                />

                <circle
                  cx="56"
                  cy="56"
                  r={RADIUS}
                  stroke="#14b8a6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={
                    CIRCUMFERENCE - (CIRCUMFERENCE * percent) / 100
                  }
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-teal-300 text-xl font-semibold">
                  {percent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
