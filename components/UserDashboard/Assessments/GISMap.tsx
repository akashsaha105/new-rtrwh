"use client";

import React, { useState } from "react";
import MajorAquifersMap from "./AquiferMap";
import GroundWaterMap from "./GroundWaterMap";

export default function GISMap() {
  const [activeTab, setActiveTab] = useState<"aquifer" | "groundwater">(
    "aquifer"
  );

  return (
    <div className="w-full">
      {/* TAB BUTTONS */}
      <div className="flex justify-center gap-4 mt-5 mb-6">
        <button
          onClick={() => setActiveTab("aquifer")}
          className={`px-6 py-2 rounded-lg text-sm font-semibold border 
            ${
              activeTab === "aquifer"
                ? "bg-teal-600 text-white border-teal-700"
                : "bg-white/10 text-gray-200 border-gray-500 hover:bg-white/20"
            }`}
        >
          Aquifer Map
        </button>

        <button
          onClick={() => setActiveTab("groundwater")}
          className={`px-6 py-2 rounded-lg text-sm font-semibold border 
            ${
              activeTab === "groundwater"
                ? "bg-teal-600 text-white border-teal-700"
                : "bg-white/10 text-gray-200 border-gray-500 hover:bg-white/20"
            }`}
        >
          Groundwater Map
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="mt-4">
        {activeTab === "aquifer" && <MajorAquifersMap />}
        {activeTab === "groundwater" && <GroundWaterMap />}
      </div>
    </div>
  );
}
