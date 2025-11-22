import React from "react";
import { Droplets, Database, TrendingDown, GlassWater } from "lucide-react";

interface performanceProps {
    systemEfficiency?: number | string;
    demandCoverage?: number | string;
    overflowLoss?: number | string;
    waterQuality?: number | string;
}
export default function Performance(performanceProps: performanceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <div className="p-6 rounded-xl shadow-lg border border-teal-500">
        <div className="flex items-center gap-3">
          <Droplets className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-teal-300">System Efficiency</h3>
        </div>
        <p className="text-2xl font-bold mt-3">{performanceProps.systemEfficiency ?? "8"}%</p>
        <p className="text-sm text-white/60">Captured vs. potential rainfall</p>
      </div>

      <div className="p-6 rounded-xl shadow-lg border border-teal-500">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-yellow-400" />  
          <h3 className="text-lg font-semibold text-teal-300">Overflow Risk</h3>
        </div>
        <p className="text-2xl font-bold mt-3">{performanceProps.demandCoverage ?? "67"}%</p>
        <p className="text-sm text-white/60">
          Household demand met by rainwater
        </p>
      </div>

      <div className="p-6 rounded-xl shadow-lg border border-teal-500">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-6 w-6 text-red-400" />
          <h3 className="text-lg font-semibold text-teal-300">Net Overflow Loss</h3>
        </div>
        <p className="text-2xl font-bold mt-3">{performanceProps.overflowLoss ?? "2,500"} L</p>
        <p className="text-sm text-white/60">This month’s wastage</p>
      </div>

      <div className="p-6 rounded-xl shadow-lg border border-teal-500">
        <div className="flex items-center gap-3">
          <GlassWater className="h-6 w-6 text-green-400" />
          <h3 className="text-lg font-semibold text-teal-300">Water Quality</h3>
        </div>
        <p className="text-2xl font-bold mt-3">{performanceProps.waterQuality ?? "8,000"} L</p>
        <p className="text-sm text-white/60">Recharged into aquifer</p>
      </div>
    </div>
  );
}
