import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


type DataPoint = { month: string; rainfall: number; harvested: number };
type HarvestedChartProps = { data: DataPoint[] };

export default function SeasonalTrend({data}: HarvestedChartProps) {
  return (
    <div className="mb-12">
      <h4 className="text-2xl font-semibold text-pink-300 mb-6">
        Seasonal Performance Trend
      </h4>
      <div className="h-80 bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-md">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#666" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="harvested"
              stroke="#f472b6"
              strokeWidth={3}
              name="Harvested (L)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
