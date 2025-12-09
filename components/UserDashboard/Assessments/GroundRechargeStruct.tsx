import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export default function GroundRechargeStruct() {
  const t = useTranslations("assessment");
  const [result, setResult] = useState(null);

  const allStructures = [
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
      type: "Storage Tank",
      dimension: "2.5m x 2.5m x 1.5m",
      capacity: "5,000 L",
      suitability: "All soil types",
      image:
        "https://5.imimg.com/data5/SELLER/Default/2024/2/385312739/OW/QZ/XM/26601267/sintex-water-tank.jpg",
      description:
        "A storage tank is a container used to store collected rainwater for later use. It can be placed above or below ground.",
      benefits: [
        "Stores water for immediate use",
        "Reduces reliance on municipal water",
        "Can be integrated with filtration systems",
      ],
      priceRange: "₹ 20,000 – ₹ 50,000 (capacity dependent)",
    },
  ];

  const [structures, setStructures] = useState(allStructures);
  const [selectedStructure, setSelectedStructure] = React.useState<null | typeof allStructures[0]>(null);

  useEffect(() => {
    let unsubUser: () => void;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Subscribe to user document changes
        unsubUser = onSnapshot(doc(firestore, "users", user.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const queryParams = new URLSearchParams({
              rooftop_area_m2: String(userData.rooftop.area || 100),
              rooftop_type: userData.rooftop.type || "concrete",
              lat: String(userData.geopoint[0] || 11.0500),
              lon: String(userData.geopoint[1] || 76.9000),
            });

            const response = await fetch(`http://0.0.0.0:8001/rwh-design?${queryParams}`);

            if (response.ok) {
              const data = await response.json();
              setResult(data);
              console.log(data);
              // Ensure we handle if API returns explicit depth or we parse it
              const depth = parseFloat(data.depth_m_below_ground);

              // Filtering Logic
              // if depth > 3 then recommand recharge pit and storage tank
              // else if depth > 10 then recommand recharge shaft and recharge pits and storage tank
              // else if depth < 3 then recommand only storage tank

              let recommendedTypes: string[] = [];

              if (data.groundwater.depth_m_below_ground > 10) {
                recommendedTypes = ["Recharge Shaft", "Recharge Pit", "Storage Tank"];
              } else if (data.groundwater.depth_m_below_ground > 3) {
                recommendedTypes = ["Recharge Pit", "Storage Tank"];
              } else {
                recommendedTypes = ["Storage Tank"];
              }

              const filtered = allStructures.filter(s => recommendedTypes.includes(s.type));
              setStructures(filtered);
            }
          }
        });
      } else {
        // User logged out
        setStructures(allStructures);
        if (unsubUser) unsubUser();
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  return (
    <div className="mt-3 mb-12">
      <h4 className="text-2xl font-semibold text-teal-400 mb-6 flex items-center gap-2">
        Recommended Structures
      </h4>

      {/* Local modal state (scoped via IIFE) */}
      {(() => {
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {structures.map((structure, idx) => (
                <div
                  key={idx}
                  className="relative bg-slate-900/80 backdrop-blur-lg p-6 rounded-2xl border border-teal-700 shadow-lg hover:shadow-xl transition"
                >
                  <h5 className="text-xl font-bold text-teal-300 mb-3">
                    {structure.type}
                  </h5>
                  <ul className="space-y-2 text-sm text-slate-200">
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
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-lg text-sm cursor-pointer shadow"
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
