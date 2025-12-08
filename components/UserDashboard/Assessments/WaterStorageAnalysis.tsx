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
    <div className="mt-10 relative">
      {/* Ambient Background Glow */}
      <div className="absolute -top-20 left-1/4 w-1/2 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-1/3 h-64 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      <h3 className="text-lg font-semibold mb-6 text-gray-200 relative z-10 flex items-center gap-2" id="harvest_1">
        <span className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
        {t("rainwaterHarvestAnalysis")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
        {/* ================================================== */}
        {/* 1️⃣ Rain Collected */}
        {/* ================================================== */}
        <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl group relative overflow-hidden ring-1 ring-white/5 hover:ring-indigo-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition duration-500" />

          <div className="flex items-center justify-between gap-6 relative">
            {/* Text Column */}
            <div className="flex-1">
              <h3 className="text-base font-medium text-indigo-200/90 tracking-wide uppercase text-xs">
                {t("rainCollected")}
              </h3>

              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 drop-shadow-sm">
                  {Math.round(roofRainCaptured).toLocaleString()}
                </p>
                <span className="text-sm text-indigo-200/50 font-medium">Liters</span>
              </div>

              <p className="text-sm text-gray-400 mt-2 font-light leading-relaxed">
                Practical estimate before considering roof runoff efficiency.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 2️⃣ Total Harvest Potential */}
        {/* ================================================== */}
        <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl group relative overflow-hidden ring-1 ring-white/5 hover:ring-teal-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-teal-500/30 transition duration-500" />

          <div className="flex items-center justify-between gap-6 relative">
            {/* Text Column */}
            <div className="flex-1">
              <h3
                className="text-base font-medium text-teal-200/90 tracking-wide uppercase text-xs"
                id="harvest_2"
              >
                {t("totalHarvestPotential")}
              </h3>

              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-200 drop-shadow-sm">
                  {Math.round(harvestPotential).toLocaleString()}
                </p>
                <span className="text-sm text-teal-200/50 font-medium">Liters</span>
              </div>

              <p className="text-sm text-gray-400 mt-2 font-light leading-relaxed">
                Maximum annual rooftop capture based on rainfall & roof size.
              </p>
            </div>

            {/* Ring Column */}
            <div className="w-24 h-24 relative flex justify-center items-center shrink-0">
              {/* Glow behind ring */}
              <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />

              <svg className="w-full h-full rotate-[-90deg] drop-shadow-lg">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                  fill="transparent"
                />

                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#2dd4bf"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={
                    (2 * Math.PI * 40) - ((2 * Math.PI * 40) * percent) / 100
                  }
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center pt-1">
                <span className="text-teal-50 text-base font-bold tracking-tight">
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
