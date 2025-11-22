"use client";

import { Bot, Droplet, Ruler, BarChart3 } from "lucide-react";
import { CubeIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// interface Props {
//   rainfall: number;
//   rooftopArea: number;
//   rooftopType: string;
//   openSpace: number;
//   numberOfDwellers: number;
//   harvested: number;
// }

interface Props {
  structure: string;
  details: string;
  dimensions: string;
  match: number;
}

function PitModel() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4F46E5" roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

function parseDimensions(input: string) {
  if (!input) return { length: 0, width: 0, height: 0 };

  // Normalize the format:
  // - Lowercase
  // - Remove spaces
  // - Replace special × with x
  // - Remove all units like "m"
  const clean = input
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, "")
    .replace(/m/g, ""); // remove meters

  // Now split by x
  const parts = clean.split("x");

  if (parts.length !== 3) return { length: 0, width: 0, height: 0 };

  // Convert to numbers (support decimals)
  const [l, w, h] = parts.map((value) => parseFloat(value));

  return {
    length: isNaN(l) ? 0 : l,
    width: isNaN(w) ? 0 : w,
    height: isNaN(h) ? 0 : h,
  };
}


export default function RechargeStructure({props}: {props: Props | null}) {
  const [open, setOpen] = useState(false);

  const dims = parseDimensions(props?.dimensions ? props.dimensions : "");
  return (
    <div className="mb-10">
      {/* Header */}
      <h3 className="flex items-center gap-2 text-xl font-semibold mb-4 tracking-wide text-slate-200">
        <Bot size={20} className="text-purple-400" />
        AI SUGGESTED RECHARGE STRUCTURE
      </h3>

      {/* Card */}
      <div className="flex flex-col flex-1">
        <div className="relative h-110 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]">
          {/* Glow Effects */}
          <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen bg-[radial-gradient(circle_at_top,_#7c3aed33,_transparent_60%),radial-gradient(circle_at_bottom,_#0ea5e933,_transparent_60%)]" />

          {/* Content */}
          <div className="relative p-6 md:p-7">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-800/40 flex items-center justify-center border border-indigo-500/40">
                  <Droplet size={20} className="text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xl text-indigo-300 font-bold">
                    {/* Recharge Pit */}
                    {props?.structure}
                  </h4>
                  <p className="text-sm text-slate-400">
                    Best match based on roof type & rain pattern
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-700/40 text-indigo-200 border border-indigo-500/40 shadow-inner">
                {/* 75% Match */}
                {props?.match}% Match
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="w-full h-2 rounded-full bg-slate-700/50 mb-5 overflow-hidden">
              <div className="h-full w-[75%] bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"></div>
            </div>

            {/* Description */}
            <p className="text-slate-300/90 leading-relaxed text-sm mb-5">
              {/* This recharge pit is optimized for efficient groundwater
              percolation and suited for household-level RWH systems. */}
                    {props?.details}
            </p>

            {/* Info Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <Ruler size={18} className="text-indigo-300" />
                  <span className="text-indigo-200 font-semibold">
                    Dimensions
                  </span>
                </div>
                <p className="text-slate-300 text-sm">
                  {/* 2 pit(s), each <strong>2m × 2m × 2m</strong> */}
                  <strong>{props?.dimensions}</strong>
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 size={18} className="text-teal-300" />
                  <span className="text-teal-200 font-semibold">Capacity</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Total capacity: <strong>{dims.length * dims.width * dims.height * 1000} L</strong>
                </p>
              </div>
            </div>

            {/* 3D Preview Button */}
            <button
              onClick={() => setOpen(true)}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold
                       shadow-lg shadow-indigo-800/40 border border-indigo-500/40
                       hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]
                       active:scale-[0.97] transition-all duration-200"
            >
              <CubeIcon width={22} className="text-white" />
              Preview 3D Structure
            </button>

            {/* Footer */}
            <p className="mt-5 text-sm text-slate-400/80 mb-1">
              Suggestions are auto-generated using roof geometry, space
              availability, soil type & rainfall.
            </p>
          </div>
        </div>
      </div>
      {/* 3D MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-2xl p-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-slate-300 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-slate-200 mb-3">
              Interactive 3D Recharge Pit
            </h2>

            <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-700">
              <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <OrbitControls enableZoom={true} />
                <PitModel />
              </Canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
