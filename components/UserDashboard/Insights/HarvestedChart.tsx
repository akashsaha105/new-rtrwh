import React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DataPoint = { month: string; rainfall: number; harvested: number };
type HarvestedChartProps = { data: DataPoint[] };

export default function HarvestedChart({ data }: HarvestedChartProps) {

  return (
    <div className="mb-12">
      <h4 className="text-2xl font-semibold text-cyan-300 mb-6">
        Rainfall vs Harvested Water
      </h4>
      <div className="h-80 bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-md">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#666" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rainfall" fill="#60a5fa" name="Rainfall (L)" />
            <Bar dataKey="harvested" fill="#34d399" name="Harvested (L)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
