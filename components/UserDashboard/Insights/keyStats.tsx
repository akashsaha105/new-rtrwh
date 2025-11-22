import React from "react";
import { Database, Droplets, CloudRain } from "lucide-react";

interface keyStatsProps {
  rainCaptured?: string | number;

  tankUtilization?: string | number;
  tankWaterLiters?: string | number;

  groundWaterRecharge?: string | number;
  rechargeWaterLiters?: string | number;
}

export default function KeyStats({
  rainCaptured,
  tankUtilization,
  tankWaterLiters,
  groundWaterRecharge,
  rechargeWaterLiters,
}: keyStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* <div className="bg-teal-950 p-6 rounded-xl shadow-lg border-2 border-teal-500"> */}
      <div className="bg-teal-950 p-6 rounded-xl shadow-lg border-2 border-teal-500">
        <div className="flex items-center gap-3">
          <Droplets className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold">Rain Harvested</h3>
        </div>
        <p className="text-2xl font-bold mt-3">
          {rainCaptured?.toLocaleString() ?? "---"} Liters
        </p>
        {/* <p className="text-sm text-white/60">This month’s total</p> */}
        <p className="text-sm text-white/60">Storage Tank + Recharge Pit</p>
      </div>

      <div className="bg-white/10 p-6 rounded-xl shadow-lg border-2 border-teal-500">
        <div className="flex items-center gap-3">
          <CloudRain className="h-6 w-6 text-green-400" />
          <h3 className="text-lg font-semibold">Groundwater Recharge</h3>
        </div>
        <p className="text-2xl font-bold mt-3">
          ↑ {groundWaterRecharge ?? "12"}%
        </p>
        {/* <p className="text-sm text-white/60">12,000 liters contributed</p> */}
        <p className="text-sm text-white/60">
          {rechargeWaterLiters?.toLocaleString() ?? "---"} liters contributed
        </p>
      </div>

      <div className="bg-white/10 p-6 rounded-xl shadow-lg border-2 border-teal-500">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-yellow-400" />
          <h3 className="text-lg font-semibold">Tank Utilization</h3>
        </div>
        <p className="text-2xl font-bold mt-3">{tankUtilization ?? "---"}%</p>
        {/* <p className="text-sm text-white/60">Current storage filled</p> */}
        <p className="text-sm text-white/60">
          {tankWaterLiters?.toLocaleString() ?? "---"} Liters Utilized
        </p>
      </div>
    </div>
  );
}
