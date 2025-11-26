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
type HarvestedChartProps = { data?: DataPoint[] };

export default function HarvestedChart({ data }: HarvestedChartProps) {

  // Dummy data if no data is provided
  const dummyData: DataPoint[] = [
    { month: "Jan", rainfall: 1200, harvested: 0 },
    { month: "Feb", rainfall: 900, harvested: 0 },
    { month: "Mar", rainfall: 1500, harvested: 0 },
    { month: "Apr", rainfall: 1800, harvested: 0 },
    { month: "May", rainfall: 2200, harvested: 0 },
    { month: "Jun", rainfall: 3000, harvested: 0 },
    { month: "Jul", rainfall: 3500, harvested: 0 },
    { month: "Aug", rainfall: 2800, harvested: 0 },
    { month: "Sep", rainfall: 1900, harvested: 0 },
    { month: "Oct", rainfall: 800, harvested: 700 },
    { month: "Nov", rainfall: 200, harvested: 100 },
  ];

  const rawData = data && data.length > 0 ? data : dummyData;

  // Convert all values to 2-decimal numbers
  const finalData = rawData.map(item => ({
    ...item,
    rainfall: Number(item.rainfall.toFixed(2)),
    harvested: Number(item.harvested.toFixed(2)),
  }));

  return (
    <div className="mb-12">
      <h4 className="text-2xl font-semibold text-cyan-300 mb-6">
        Rainfall vs Harvested Water
      </h4>

      <div className="h-80 bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-md">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={finalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#666" />
            <XAxis dataKey="month" />

            {/* Y-axis values ALWAYS fixed(2) */}
            <YAxis tickFormatter={(v) => v.toFixed(2)} />

            {/* Tooltip formatting */}
            <Tooltip
              formatter={(value: number) => value.toFixed(2)}
            />

            <Bar dataKey="rainfall" fill="#60a5fa" name="Rainfall (L)" />
            <Bar dataKey="harvested" fill="#34d399" name="Harvested (L)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
