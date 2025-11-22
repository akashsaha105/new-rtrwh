import React from "react";

export default function Efficiency() {
  const [material, setMaterial] = React.useState<string>("RCC");
  const [slopeDeg, setSlopeDeg] = React.useState<number>(5);
  const [cleanliness, setCleanliness] = React.useState<string>("Clean");
  const [drainage, setDrainage] = React.useState<string>("Good");
  const [firstFlush, setFirstFlush] = React.useState<string>("Available");

  const [loadingEff, setLoadingEff] = React.useState(false);
  const [lastBreakdown, setLastBreakdown] = React.useState<{
    materialScore: number;
    slopeScore: number;
    cleanlinessScore: number;
    drainageScore: number;
    lossScore: number;
  } | null>(null);
  const [effValue, setEffValue] = React.useState<number | null>(null);

  return (
    <div className="relative p-6 mt-10 rounded-2xl border border-teal-700 bg-slate-900/80 backdrop-blur-lg shadow-xl">
      <h4 className="text-2xl font-bold text-slate-100 mb-4">
        Rooftop Efficiency Calculator
      </h4>

      {/* Local state for this section */}
      {(() => {
        // const [material, setMaterial] = React.useState<string>("RCC");
        // const [slopeDeg, setSlopeDeg] = React.useState<number>(5);
        // const [cleanliness, setCleanliness] =
        //   React.useState<string>("Clean");
        // const [drainage, setDrainage] = React.useState<string>("Good");
        // const [firstFlush, setFirstFlush] =
        //   React.useState<string>("Available");

        // const [loadingEff, setLoadingEff] = React.useState(false);
        // const [effValue, setEffValue] = React.useState<number | null>(null);
        // const [lastBreakdown, setLastBreakdown] = React.useState<{
        //   materialScore: number;
        //   slopeScore: number;
        //   cleanlinessScore: number;
        //   drainageScore: number;
        //   lossScore: number;
        // } | null>(null);

        const materialScores: Record<string, number> = {
          RCC: 0.95,
          Tile: 0.9,
          Metal: 0.85,
          Asbestos: 0.75,
          "Other / Rough": 0.8,
        };

        const cleanlinessScores: Record<string, number> = {
          Clean: 0.95,
          "Moderately clean": 0.85,
          Dirty: 0.7,
        };

        const drainageScores: Record<string, number> = {
          Good: 0.95,
          Average: 0.85,
          Poor: 0.7,
        };

        const firstFlushScores: Record<string, number> = {
          Available: 0.95, // fewer losses
          "Not available": 0.8,
        };

        const getSlopeScore = (deg: number) => {
          if (deg < 2) return 0.8;
          if (deg <= 10) return 0.95;
          if (deg <= 25) return 0.9;
          return 0.8;
        };

        const handleCalculate = () => {
          setLoadingEff(true);

          const materialScore =
            materialScores[material] ?? materialScores["Other / Rough"];
          const slopeScore = getSlopeScore(slopeDeg || 0);
          const cleanlinessScore =
            cleanlinessScores[cleanliness] ??
            cleanlinessScores["Moderately clean"];
          const drainageScore =
            drainageScores[drainage] ?? drainageScores.Average;
          const lossScore =
            firstFlushScores[firstFlush] ?? firstFlushScores["Not available"];

          const rawEfficiency =
            materialScore *
            slopeScore *
            cleanlinessScore *
            drainageScore *
            lossScore *
            100;

          setLastBreakdown({
            materialScore,
            slopeScore,
            cleanlinessScore,
            drainageScore,
            lossScore,
          });

          // Fake premium loader for ~2.2s
          setTimeout(() => {
            setEffValue(Math.min(100, Math.max(0, rawEfficiency)));
            setLoadingEff(false);
          }, 2200);
        };

        const currentEff = effValue ?? 0;
        const level =
          currentEff < 60 ? "Low" : currentEff < 80 ? "Moderate" : "High";

        const levelColor =
          level === "High"
            ? "text-emerald-400"
            : level === "Moderate"
            ? "text-amber-300"
            : "text-rose-400";

        const gaugeColor =
          level === "High"
            ? "#22c55e"
            : level === "Moderate"
            ? "#facc15"
            : "#fb7185";

        return (
          <>
            {/* Input controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">
                  Roof material
                </label>
                <select
                  className="w-full rounded-lg bg-slate-800/70 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                >
                  <option value="RCC">RCC / Concrete</option>
                  <option value="Tile">Tile</option>
                  <option value="Metal">Metal / Sheet</option>
                  <option value="Asbestos">Asbestos</option>
                  <option value="Other / Rough">Other / Rough surface</option>
                </select>

                <label className="block text-sm font-medium text-slate-200">
                  Roof slope (°)
                </label>
                <input
                  type="number"
                  min={0}
                  max={45}
                  value={slopeDeg}
                  onChange={(e) => setSlopeDeg(Number(e.target.value) || 0)}
                  className="w-full rounded-lg bg-slate-800/70 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <label className="block text-sm font-medium text-slate-200">
                  Cleanliness level
                </label>
                <select
                  className="w-full rounded-lg bg-slate-800/70 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={cleanliness}
                  onChange={(e) => setCleanliness(e.target.value)}
                >
                  <option value="Clean">Clean</option>
                  <option value="Moderately clean">Moderately clean</option>
                  <option value="Dirty">Dirty</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">
                  Drainage condition
                </label>
                <select
                  className="w-full rounded-lg bg-slate-800/70 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={drainage}
                  onChange={(e) => setDrainage(e.target.value)}
                >
                  <option value="Good">Good (no ponding, clear flow)</option>
                  <option value="Average">Average</option>
                  <option value="Poor">
                    Poor (frequent clogging / ponding)
                  </option>
                </select>

                <label className="block text-sm font-medium text-slate-200">
                  First-flush availability
                </label>
                <select
                  className="w-full rounded-lg bg-slate-800/70 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={firstFlush}
                  onChange={(e) => setFirstFlush(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Not available">Not available</option>
                </select>

                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={loadingEff}
                  className={`mt-4 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-900/50 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:via-teal-300 hover:to-emerald-300 transition-all ${
                    loadingEff ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {loadingEff ? "Calculating..." : "Calculate Efficiency"}
                </button>
              </div>
            </div>

            {/* Gauge + breakdown */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Circular gauge with premium loader */}
              <div className="flex items-center justify-center">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  {/* Background circle */}
                  <svg
                    className="w-full h-full rotate-[-90deg]"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1f2937"
                      strokeWidth="10"
                      fill="none"
                    />
                    {/* Animated loader or progress arc */}
                    {loadingEff ? (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="url(#loaderGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset="180"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="180;40;180"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    ) : (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={gaugeColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * currentEff) / 100}
                      />
                    )}

                    {/* Gradients */}
                    <defs>
                      <linearGradient
                        id="loaderGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {loadingEff ? (
                      <>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Computing
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          Rooftop efficiency
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-slate-50">
                          {currentEff.toFixed(0)}%
                        </div>
                        <div
                          className={`mt-1 text-sm font-semibold ${levelColor}`}
                        >
                          {level} efficiency
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3 text-sm text-slate-200">
                <p className="text-slate-300 text-sm mb-2">
                  Rooftop efficiency combines multiple factors: material, slope,
                  cleanliness, drainage, and first-flush losses. Use this to
                  understand which factor to improve.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2">
                    <div className="text-xs text-slate-400">Material</div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{material || "—"}</span>
                      <span className="text-teal-300 text-xs">
                        ×{" "}
                        {lastBreakdown
                          ? lastBreakdown.materialScore.toFixed(2)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2">
                    <div className="text-xs text-slate-400">
                      Slope ({slopeDeg || 0}°)
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{slopeDeg || 0}°</span>
                      <span className="text-teal-300 text-xs">
                        ×{" "}
                        {lastBreakdown
                          ? lastBreakdown.slopeScore.toFixed(2)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2">
                    <div className="text-xs text-slate-400">Cleanliness</div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {cleanliness || "—"}
                      </span>
                      <span className="text-teal-300 text-xs">
                        ×{" "}
                        {lastBreakdown
                          ? lastBreakdown.cleanlinessScore.toFixed(2)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2">
                    <div className="text-xs text-slate-400">Drainage</div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{drainage || "—"}</span>
                      <span className="text-teal-300 text-xs">
                        ×{" "}
                        {lastBreakdown
                          ? lastBreakdown.drainageScore.toFixed(2)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 sm:col-span-2">
                    <div className="text-xs text-slate-400">
                      First-flush / losses
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{firstFlush || "—"}</span>
                      <span className="text-teal-300 text-xs">
                        ×{" "}
                        {lastBreakdown
                          ? lastBreakdown.lossScore.toFixed(2)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {!loadingEff && effValue != null && (
                  <p className="text-xs text-slate-400 mt-2">
                    Final rooftop efficiency = materialScore × slopeScore ×
                    cleanlinessScore × drainageScore × lossScore × 100
                  </p>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
