// import { useTranslations } from "next-intl";
// import React from "react";

// export default function KeyBenefits() {
//     const t = useTranslations("assessment");
//   return (
//     <div>
//       <h4 className="text-xl font-semibold text-purple-300 mt-10 my-4">
//         🌱 {t("keyBenefits")}
//       </h4>
//       <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {[
//           "Save up to 40% on water bills",
//           "Recharge groundwater",
//           "Eco-friendly solution",
//           "Eligible for subsidies",
//           "IoT monitoring options",
//           "Drought resilience",
//         ].map((benefit, i) => (
//           <li
//             key={i}
//             className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-4 rounded-xl transition"
//           >
//             ✅ <span className="text-gray-200">{benefit}</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
"use client";

import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

interface RecommendationProps {
  rooftopArea?: number;
  dwellers?: number;
  buildingType?: string;       // residential, commercial, industrial
  availableSpace?: number;
  systemType?: string;          // rooftop, surface, recharge, etc
}

export default function KeyBenefits({
  rooftopArea,
  dwellers,
  buildingType,
  availableSpace,
  systemType,
}: RecommendationProps) {
  const t = useTranslations("assessment");

  // ---------------- AI SCORING RECOMMENDATION ENGINE ----------------
  const recommendations = useMemo(() => {
    const list: string[] = [];

    // Rooftop area–based logic
    if (rooftopArea) {
      if (rooftopArea > 100) {
        list.push("High rooftop area: Suitable for large capacity harvesting systems");
        list.push("Can generate significant water savings (40–60%)");
      } else if (rooftopArea > 40) {
        list.push("Moderate rooftop area: Ideal for medium-scale tank systems");
      } else {
        list.push("Small rooftop area: Recommend compact modular harvesting units");
      }
    }

    // Dwellers logic
    if (dwellers) {
      if (dwellers >= 10) {
        list.push("High occupancy: System can substantially reduce utility bills");
      } else if (dwellers >= 4) {
        list.push("Medium occupancy: Great for domestic water reuse and flushing");
      } else {
        list.push("Low occupancy: Basic harvesting system is sufficient");
      }
    }

    // Building type logic
    if (buildingType) {
      const type = buildingType.toLowerCase();
      if (type === "commercial") {
        list.push("Commercial building: High ROI due to high non-potable usage");
      }
      if (type === "industrial") {
        list.push("Industrial use: Ideal for process water and groundwater recharge");
      }
      if (type === "residential") {
        list.push("Residential use: Perfect for reducing municipal water dependency");
      }
    }

    // Available space logic
    if (availableSpace) {
      if (availableSpace > 50) {
        list.push("Large available space: Suitable for underground tanks or recharge pits");
      } else if (availableSpace > 20) {
        list.push("Moderate space: Consider medium-sized storage structures");
      } else {
        list.push("Limited space: Recommend vertical tanks or compact recharge shafts");
      }
    }

    // System type logic
    if (systemType) {
      if (systemType.includes("recharge")) {
        list.push("Recharge system boosts groundwater levels significantly");
      }
      if (systemType.includes("storage")) {
        list.push("Storage system enables direct household usage and bill reduction");
      }
      if (systemType.includes("surface")) {
        list.push("Surface harvesting helps reduce site runoff and flooding");
      }
    }

    // Always include universal benefits
    list.push("Eco-friendly and sustainable solution");
    list.push("Eligible for government subsidies");
    list.push("Supports drought resilience and water security");

    return list;
  }, [rooftopArea, dwellers, buildingType, availableSpace, systemType]);

  // ----------------------- UI (UNCHANGED DESIGN) -----------------------
  return (
    <div>
      <h4 className="text-xl font-semibold text-purple-300 mt-10 my-4">
        🌱 {t("keyBenefits")}
      </h4>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((benefit, i) => (
          <li
            key={i}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-4 rounded-xl transition"
          >
            ✅ <span className="text-gray-200">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
