"use client";

import React, { useEffect, useState } from "react";

interface PredictionData {
  predictedStorage: number;
  extraStorageNeeded: number;
  paybackYears: number;
  demandCoverage: number;
  overflowRisk: string;
}

export default function Prediction() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [recommend, setRecommend] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrediction() {
      try {
        const payload = {
          rainfall: 240,
          harvested: 360,
          tankUtilization: 10,
          rechargeUtilization: 2,
          storageEfficiency: 0.999,
          rechargeEfficiency: 0.999,
          overflowLoss: 100,
          infiltrationRate: 10,
        };

        const res1 = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const res2 = await fetch("/api/recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json1 = await res1.json();
        const json2 = await res2.json();

        setData(json1);
        setRecommend(Array.isArray(json2) ? json2 : []);
      } catch (err) {
        console.error("Prediction fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPrediction();
  }, []);

  return (
    <>
      <h4 className="text-2xl text-emerald-300 mb-4">
        📈 AI Predictions & Recommendations
      </h4>

      <div className="
      p-6 rounded-2xl shadow-lg
       border border-teal-500 
       mix-blend-screen bg-[radial-gradient(circle_at_top,_#22d3ee19,_transparent_55%),radial-gradient(circle_at_bottom,_#4ade8014,_transparent_55%)]
       ">
        {loading ? (
          <p className="text-white/60 text-sm animate-pulse">
            Generating AI predictions…
          </p>
        ) : !data ? (
          <p className="text-red-400 text-sm">Failed to load predictions.</p>
        ) : (
          <ul className="space-y-3 text-sm text-white/80">
            <h1 className="text-teal-300 text-base">Predictions</h1>
            <li>
              • Based on forecasted rainfall, your system will likely store{" "}
              <span className="text-emerald-300 font-semibold">
                {data.predictedStorage} L
              </span>{" "}
              by end of next month.
            </li>

            <li>
              • Overflow risk is {data.overflowRisk}. Adding{" "}
              <span className="text-emerald-300 font-semibold">
                +{data.extraStorageNeeded} L
              </span>{" "}
              storage can reduce wastage dramatically.
            </li>

            <li>
              • With current efficiency, expect a payback period of{" "}
              <span className="text-emerald-300 font-semibold">
                {data.paybackYears} years
              </span>
              .
            </li>

            <li>
              • System is covering{" "}
              <span className="text-emerald-300 font-semibold">
                {(data.demandCoverage * 100).toFixed(1)}%
              </span>{" "}
              of your household demand — consider adding a secondary recharge
              pit.
            </li>

            {/* FIXED: render each recommendation */}
            {/* {!recommend ? () :recommend.map((r, i) => (
              <li key={i}>• {r}</li>
            ))} */}
            <h1 className="text-teal-300 text-base mt-7">Recommendations</h1>
            {!recommend ? (
                <p className="text-red-400 text-sm">Failed to load predictions.</p>
            ): (
              recommend.map((r, i) => (
                <li key={i}>• {r}</li>
              ))
            )}
          </ul>
        )}
      </div>
    </>
  );
}
