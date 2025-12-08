import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";

type FeasibilitySummary = {
  category: "High" | "Moderate" | "Low";
  score: number;
};

interface RecommendedStructure {
  type: string;
  reason?: string;
  confidence?: number;
}

export default function RecommendedStorageTank(
  props: {
    feasibility?: FeasibilitySummary;
    recommendedStructures?: RecommendedStructure[];
  } = {}
) {
  const t = useTranslations("assessment");

  const tanks = [
    {
      type: "Underground Tank",
      dimension: "5m x 4m x 3m",
      capacity: "60,000 L",
      utilization: 72,
      image:
        "https://static.vecteezy.com/system/resources/thumbnails/069/499/166/small/concrete-water-basin-construction-site-image-photo.jpg",
      description:
        "An underground storage tank is constructed below ground level and is ideal for large volume storage without occupying usable surface space.",
      benefits: [
        "Saves surface space for parking or landscaping",
        "Maintains cooler water temperature",
        "Aesthetically hidden from view",
      ],
      costRange: "₹ 1,50,000 – ₹ 3,00,000 (capacity & site dependent)",
    },
    {
      type: "Overhead Tank",
      dimension: "3m x 3m x 4m",
      capacity: "36,000 L",
      utilization: 85,
      image:
        "https://housing.com/news/wp-content/uploads/2022/12/Overhead-water-tank-location-and-position-as-per-Vastu.jpg",
      description:
        "An overhead storage tank is installed at an elevated level to provide gravity-based water pressure for domestic and flushing usage.",
      benefits: [
        "Provides good water pressure without pumps",
        "Easy to inspect and maintain",
        "Suitable for distribution across multiple floors",
      ],
      costRange: "₹ 80,000 – ₹ 2,00,000 (structure & size dependent)",
    },
    {
      type: "Rain Barrel / Drum",
      dimension: "Ø 0.6m x 1m",
      capacity: "200 - 500 L",
      utilization: 90,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz&s", // Placeholder
      description: "Simple plastic or metal drums connected to the downspout for small-scale garden watering and cleaning.",
      benefits: [
        "Very low cost and easy DIY installation",
        "Perfect for small gardens and balconies",
        "Modular: can connect multiple barrels"
      ],
      costRange: "₹ 2,000 – ₹ 5,000 per barrel"
    },
    {
      type: "Ferro-cement Tank",
      dimension: "Variable (Cylindrical)",
      capacity: "10,000 - 50,000 L",
      utilization: 80,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz&s", // Placeholder
      description: "A tank made of wire mesh and cement mortar, which is cheaper and lighter than RCC tanks.",
      benefits: [
        "Cost-effective compared to RCC",
        "Durable and crack-resistant",
        "Can be built above or partially below ground"
      ],
      costRange: "₹ 5 – ₹ 8 per litre"
    }
  ];

  const [displayTanks, setDisplayTanks] = useState(tanks);

  useEffect(() => {
    if (props.recommendedStructures && props.recommendedStructures.length > 0) {
      const dynamicTanks = tanks.map((tank) => {
        const match = props.recommendedStructures?.find(r =>
          r.type.toLowerCase().includes(tank.type.toLowerCase()) ||
          tank.type.toLowerCase().includes(r.type.toLowerCase())
        );

        if (match) {
          return {
            ...tank,
            reason: match.reason,
            confidence: match.confidence
          };
        }
        return tank;
      });
      setDisplayTanks(dynamicTanks);
    }
  }, [props.recommendedStructures]);

  const [selectedTank, setSelectedTank] = useState<null | {
    type: string;
    dimension: string;
    capacity: string;
    utilization: number;
    image: string;
    description: string;
    benefits: string[];
    costRange: string;
    reason?: string;
  }>(null);

  return (
    <div className="mb-12">
      <h4 className="text-2xl font-semibold text-indigo-400 mb-3 flex items-center gap-2">
        🛢️ {t("storageTankRecommendations")}
      </h4>

      {props.feasibility && (
        <div className="mb-4 inline-flex items-center gap-3 rounded-xl border border-indigo-600/60 bg-slate-900/60 px-4 py-2 text-sm text-slate-100">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Feasibility
          </span>
          <span
            className={
              props.feasibility.category === "High"
                ? "px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/50 text-xs"
                : props.feasibility.category === "Moderate"
                  ? "px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/50 text-xs"
                  : "px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/50 text-xs"
            }
          >
            {props.feasibility.category} ({props.feasibility.score}/100)
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayTanks.map((tank, idx) => (
          <div
            key={idx}
            className="relative bg-slate-900/80 backdrop-blur-lg border-indigo-700 p-6 rounded-2xl border shadow-lg hover:shadow-xl transition flex flex-col"
          >
            {/* Recommended Badge */}
            {(tank as any).reason && (
              <div className="absolute -top-3 -right-3 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                Recommended
              </div>
            )}

            <h5 className="text-xl font-bold text-indigo-300 mb-3">
              {tank.type}
            </h5>

            {(tank as any).reason && (
              <p className="text-sm text-indigo-200/80 mb-3 italic">
                &quot;{(tank as any).reason}&quot;
              </p>
            )}

            <ul className="space-y-2 text-sm text-slate-200 mb-4 flex-grow">
              <li>
                <strong>{t("dimension")}:</strong> {tank.dimension}
              </li>
              <li>
                <strong>{t("capacity")}:</strong> {tank.capacity}
              </li>
            </ul>
            <button
              className="mt-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-lg text-sm cursor-pointer shadow w-full"
              onClick={() => setSelectedTank(tank)}
            >
              {t("learnMore")}
            </button>
          </div>
        ))}
      </div>

      {/* Storage Tank Modal */}
      {selectedTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 rounded-2xl border border-indigo-700 max-w-2xl w-full mx-4 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-700">
              <h5 className="text-xl font-semibold text-indigo-300">
                {selectedTank.type}
              </h5>
              <button
                className="text-slate-400 hover:text-slate-100 text-lg"
                onClick={() => setSelectedTank(null)}
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {selectedTank.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedTank.image}
                  alt={selectedTank.type}
                  className="w-full h-56 object-cover"
                />
              )}

              <div className="p-5 space-y-4 text-sm text-slate-200">
                <div>
                  <p className="text-slate-300 mb-1 font-semibold">Overview</p>
                  <p className="text-slate-300">{selectedTank.description}</p>
                  {selectedTank.reason && (
                    <div className="mt-3 p-3 bg-indigo-900/30 border border-indigo-800 rounded-lg">
                      <p className="text-indigo-200 font-medium mb-1">Why this is recommended:</p>
                      <p className="text-indigo-100/80 italic">{selectedTank.reason}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-800/70 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Dimensions</p>
                    <p className="font-semibold">{selectedTank.dimension}</p>
                  </div>
                  <div className="bg-slate-800/70 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Capacity</p>
                    <p className="font-semibold">{selectedTank.capacity}</p>
                  </div>
                  <div className="bg-slate-800/70 rounded-lg p-3">
                    <p className="text-xs text-slate-400">
                      Typical utilization
                    </p>
                    <p className="font-semibold">
                      ~{selectedTank.utilization}% of annual demand
                    </p>
                  </div>
                  <div className="bg-slate-800/70 rounded-lg p-3">
                    <p className="text-xs text-slate-400">
                      Approx. installation cost
                    </p>
                    <p className="font-semibold">{selectedTank.costRange}</p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-300 mb-1 font-semibold">
                    Key benefits
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {selectedTank.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-400">
                  Costs are indicative and vary with excavation depth, material
                  (RCC / HDPE / masonry), site access, and local contractor
                  rates.
                </p>
              </div>

              <div className="px-5 py-3 border-t border-slate-700 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-xs rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
                  onClick={() => setSelectedTank(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
