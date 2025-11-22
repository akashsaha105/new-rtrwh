import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

interface RoofTopData {
  rooftop: {
    space: string;
  };
}

const RechargeStructure: React.FC = () => {
  const [space, setSpace] = useState<number>();

  const t = useTranslations("assessment");
  const pits = [
    {
      type: "Recharge Pit",
      dimension: "2m x 2m x 2.5m",
      capacity: "10,000 L",
      suitability: "Best for clayey soil",
    },
    {
      type: "Recharge Trench",
      dimension: "1m x 8m x 2m",
      capacity: "16,000 L",
      suitability: "Good for sandy soil",
    },
    {
      type: "Recharge Shaft",
      dimension: "Ø 1.5m x 12m",
      capacity: "25,000 L",
      suitability: "Ideal for deep aquifers",
    },
  ];

  // Load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser.uid);

        const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            try {
              const data = snapshot.data();

              const getRoofTopData = data as RoofTopData;
              if (getRoofTopData.rooftop.space != "")
                setSpace(+getRoofTopData.rooftop.space);
            } catch (e) {
              console.log(e);
            }
          } else {
            console.log("No Data found");
          }
        });

        return () => unsubscribeSnapshot(); // cleanup snapshot
      }
    });

    return () => unsubscribe(); // cleanup auth
  }, []);

  const getRecommendedPits = () => {
    if (!space) return pits; // If no data yet, show all

    if (space < 2) {
      return pits.filter((p) => p.type === "Recharge Shaft");
    }

    if (space >= 2 && space <= 6) {
      return pits.filter((p) => p.type === "Recharge Pit");
    }

    if (space > 6) {
      return pits.filter(
        (p) => p.type === "Recharge Pit" || p.type === "Recharge Trench"
      );
    }

    return pits;
  };

  return (
    <div className="mt-12 mb-12">
      <h4 className="text-2xl font-semibold text-green-400 mb-6 flex items-center gap-2">
        💧{t("rechargeStructureRecommendations")}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {getRecommendedPits().map((structure, idx) => (
          <div
            key={idx}
            className="relative bg-gradient-to-br from-green-900/40 to-green-700/20 p-6 rounded-2xl border border-green-400/30 transition transform shadow-lg"
          >
            <h5 className="text-xl font-bold text-green-300 mb-3">
              {structure.type}
            </h5>
            <ul className="space-y-2 text-sm text-white/80">
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
            <button className="mt-4 px-4 py-2 bg-green-600/60 hover:bg-green-500 text-white rounded-lg text-sm cursor-pointer">
              {t("learnMore")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RechargeStructure;
