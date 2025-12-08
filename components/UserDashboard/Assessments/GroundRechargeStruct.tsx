import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

interface RecommendedStructure {
  type: string;
  reason?: string;
  confidence?: number;
}

interface RecommendedDimensions {
  trench?: { length?: number; width?: number; depth?: number; unit?: string };
  pits?: { count?: number; diameter?: number; depth?: number; unit?: string };
  shaft?: { diameter?: number; depth?: number; unit?: string };
  pit?: {
    count?: number;
    diameter?: number;
    depth?: number;
    unit?: string;
    diameter_m?: number;
    depth_m?: number;
    volume_m3?: number;
  };
}

interface GroundRechargeStructProps {
  recommendedStructures?: RecommendedStructure[];
  recommendedDimensions?: RecommendedDimensions;
}

export default function GroundRechargeStruct({
  recommendedStructures,
  recommendedDimensions,
}: GroundRechargeStructProps) {
  const t = useTranslations("assessment");

  const staticStructures = [
    {
      type: "Recharge Pit",
      dimension: "2m x 2m x 2.5m",
      capacity: "10,000 L",
      suitability: "Best for clayey soil",
      image:
        "https://media.assettype.com/deccanherald%2F2024-07%2F22b34bdd-1d4f-403e-bb57-6ef97179e750%2Ffile7hsh68gohc4vy5h0ot1.jpg?w=undefined&auto=format%2Ccompress&fit=max",
      description:
        "A recharge pit is a deep, permeable chamber that allows roof‑top runoff to percolate quickly into the ground, improving local groundwater levels.",
      benefits: [
        "Simple and low‑maintenance design",
        "Effective in areas with limited open space",
        "Improves groundwater table around the property",
      ],
      priceRange: "₹ 40,000 – ₹ 70,000 (site‑dependent)",
    },
    {
      type: "Recharge Trench",
      dimension: "1m x 8m x 2m",
      capacity: "16,000 L",
      suitability: "Good for sandy soil",
      image:
        "https://thewotrblog.wordpress.com/wp-content/uploads/2020/07/dsc_0541-copy-1.jpg",
      description:
        "A recharge trench is a long, shallow excavation filled with filter media that spreads rainwater over a larger area for rapid infiltration.",
      benefits: [
        "Suitable where long, narrow space is available",
        "Can handle higher volumes of runoff",
        "Reduces surface flooding and waterlogging",
      ],
      priceRange: "₹ 60,000 – ₹ 1,20,000 (depending on length & media)",
    },
    {
      type: "Recharge Shaft",
      dimension: "Ø 1.5m x 12m",
      capacity: "25,000 L",
      suitability: "Ideal for deep aquifers",
      image:
        "https://5.imimg.com/data5/QM/VK/MY-30632475/rain-water-harvesting-system-500x500.jpg",
      description:
        "A recharge shaft is a vertical bore with filter packing that conveys water directly to deeper aquifers, ideal where shallow strata are less permeable.",
      benefits: [
        "Targets deeper aquifers directly",
        "Very effective in urban, space‑constrained plots",
        "Helps revive borewells and deep groundwater",
      ],
      priceRange: "₹ 1,00,000 – ₹ 2,50,000 (depending on depth)",
    },
    {
      type: "Rain Garden",
      dimension: "Variable (e.g. 5m x 3m)",
      capacity: "Variable",
      suitability: "Moderate open space & good soil",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz&s", // Placeholder or use a better URL if known
      description: "A rain garden is a depressed area in the landscape that collects rain water from a roof, driveway or street and allows it to soak into the ground.",
      benefits: [
        "Aesthetically pleasing landscape feature",
        "Filters pollutants from runoff",
        "Creates habitat for birds and butterflies"
      ],
      priceRange: "₹ 20,000 – ₹ 50,000 (DIY possible)"
    },
    {
      type: "Permeable Paving",
      dimension: "Driveway / Walkway area",
      capacity: "High infiltration rate",
      suitability: "Driveways, parking areas",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz-XvKz&s", // Placeholder
      description: "Permeable paving allows water to seep through the surface into the ground below, reducing runoff and recharging groundwater.",
      benefits: [
        "Replaces impermeable concrete/asphalt",
        "Reduces puddles and ice buildup",
        "Durable and low maintenance"
      ],
      priceRange: "₹ 150 – ₹ 300 per sq. ft."
    }
  ];

  const [displayStructures, setDisplayStructures] = useState(staticStructures);

  useEffect(() => {
    if (recommendedStructures && recommendedStructures.length > 0) {
      // Filter and map static structures to recommended ones, or fallback to static if not found
      // But actually, we might want to show ONLY the recommended ones if available?
      // Or show all but highlight recommended?
      // The user request implies "make this recommendation structure dynamic", so likely show what is recommended.

      // Let's try to match recommended types with static types.
      const dynamicStructures = recommendedStructures.map((rec) => {
        const staticMatch = staticStructures.find((s) =>
          s.type.toLowerCase().includes(rec.type.toLowerCase()) || rec.type.toLowerCase().includes(s.type.toLowerCase())
        );

        if (staticMatch) {
          // Merge data
          let dynamicDimension = staticMatch.dimension;
          let dynamicCapacity = staticMatch.capacity;

          // Update dimensions based on type
          if (rec.type.toLowerCase().includes("pit") && recommendedDimensions?.pit) {
            const { diameter_m, depth_m, volume_m3 } = recommendedDimensions.pit;
            if (diameter_m && depth_m) {
              dynamicDimension = `Ø ${diameter_m}m x ${depth_m}m`;
            }
            if (volume_m3) {
              dynamicCapacity = `${(volume_m3 * 1000).toLocaleString()} L`;
            }
          } else if (rec.type.toLowerCase().includes("trench") && recommendedDimensions?.trench) {
            const { length, width, depth } = recommendedDimensions.trench;
            if (length && width && depth) {
              dynamicDimension = `${length}m x ${width}m x ${depth}m`;
            }
          }

          return {
            ...staticMatch,
            dimension: dynamicDimension,
            capacity: dynamicCapacity,
            reason: rec.reason, // Add reason to display
            confidence: rec.confidence
          };
        }

        // If no static match, we might want to still show it if we had a generic card, 
        // but for now let's stick to matching known types to keep images/descriptions.
        return null;
      }).filter(Boolean) as typeof staticStructures & { reason?: string, confidence?: number }[];

      if (dynamicStructures.length > 0) {
        setDisplayStructures(dynamicStructures);
      }
    }
  }, [recommendedStructures, recommendedDimensions]);


  const [selectedStructure, setSelectedStructure] = React.useState<null | {
    type: string;
    dimension: string;
    capacity: string;
    suitability: string;
    image: string;
    description: string;
    benefits: string[];
    priceRange: string;
    reason?: string;
  }>(null);

  return (
    <div className="mt-8 mb-12">
      <h4 className="text-2xl font-semibold text-teal-400 mb-6 flex items-center gap-2">
        💧{t("rechargeStructureRecommendations")}
      </h4>

      {/* Local modal state (scoped via IIFE) */}
      {(() => {
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayStructures.map((structure, idx) => (
                <div
                  key={idx}
                  className="relative bg-slate-900/80 backdrop-blur-lg p-6 rounded-2xl border border-teal-700 shadow-lg hover:shadow-xl transition flex flex-col"
                >
                  {/* Recommended Badge if it has a reason/confidence (implies it came from dynamic) */}
                  {(structure as any).reason && (
                    <div className="absolute -top-3 -right-3 bg-teal-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                      Recommended
                    </div>
                  )}

                  <h5 className="text-xl font-bold text-teal-300 mb-3">
                    {structure.type}
                  </h5>

                  {(structure as any).reason && (
                    <p className="text-sm text-teal-100/80 mb-3 italic">
                      &quot;{(structure as any).reason}&quot;
                    </p>
                  )}

                  <ul className="space-y-2 text-sm text-slate-200 mb-4 flex-grow">
                    <li>
                      <strong>{t("dimension")}:</strong> {structure.dimension}
                    </li>
                    <li>
                      <strong>{t("capacity")}:</strong> {structure.capacity}
                    </li>
                    <li>
                      <strong>{t("bestFor")}:</strong> {structure.suitability}
                    </li>
                  </ul>
                  <button
                    className="mt-auto px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-lg text-sm cursor-pointer shadow w-full"
                    onClick={() => setSelectedStructure(structure)}
                  >
                    {t("learnMore")}
                  </button>
                </div>
              ))}
            </div>

            {/* Modal */}
            {selectedStructure && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-slate-900 rounded-2xl border border-teal-700 max-w-2xl w-full mx-4 shadow-2xl overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-3 border-b border-slate-700">
                    <h5 className="text-xl font-semibold text-teal-300">
                      {selectedStructure.type}
                    </h5>
                    <button
                      className="text-slate-400 hover:text-slate-100 text-lg"
                      onClick={() => setSelectedStructure(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-[70vh] overflow-y-auto">
                    {selectedStructure.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedStructure.image}
                        alt={selectedStructure.type}
                        className="w-full h-56 object-cover"
                      />
                    )}

                    <div className="p-5 space-y-4 text-sm text-slate-200">
                      <div>
                        <p className="text-slate-300 mb-1 font-semibold">
                          Overview
                        </p>
                        <p className="text-slate-300">
                          {selectedStructure.description}
                        </p>
                        {selectedStructure.reason && (
                          <div className="mt-3 p-3 bg-teal-900/30 border border-teal-800 rounded-lg">
                            <p className="text-teal-200 font-medium mb-1">Why this is recommended:</p>
                            <p className="text-teal-100/80 italic">{selectedStructure.reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-800/70 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Dimensions</p>
                          <p className="font-semibold">
                            {selectedStructure.dimension}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Capacity</p>
                          <p className="font-semibold">
                            {selectedStructure.capacity}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-lg p-3">
                          <p className="text-xs text-slate-400">
                            Best suited for
                          </p>
                          <p className="font-semibold">
                            {selectedStructure.suitability}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-lg p-3">
                          <p className="text-xs text-slate-400">
                            Approx. price
                          </p>
                          <p className="font-semibold">
                            {selectedStructure.priceRange}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-300 mb-1 font-semibold">
                          Key benefits
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {selectedStructure.benefits.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-xs text-slate-400">
                        Costs are indicative and vary with site conditions,
                        depth, materials, and local contractor rates.
                      </p>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-700 flex justify-end gap-3">
                      <button
                        className="px-4 py-2 text-xs rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
                        onClick={() => setSelectedStructure(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
