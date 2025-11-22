"use client";

import { CubeIcon } from "@heroicons/react/24/solid";
import { Bot, Container, Ruler, Gauge } from "lucide-react";
import React, { useState } from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function TankModel() {
  return (
    <mesh>
      <boxGeometry args={[2.5, 1.5, 2.5]} />
      <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

export default function RecommendedStorageTank() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full mb-10">
      {/* Header */}
      <h3 className="flex items-center gap-2 text-xl font-semibold mb-4 tracking-wide text-slate-200 uppercase">
        <Bot size={20} className="text-purple-400" />
        AI Suggested Storage Tank
      </h3>

      {/* Card */}
      <div className="flex flex-col flex-1">
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 shadow-lg backdrop-blur-xl hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-300">
          {/* Glow */}
          <div className="absolute inset-0 opacity-25 mix-blend-screen bg-[radial-gradient(circle_at_top,_#7c3aed22,_transparent_60%),radial-gradient(circle_at_bottom,_#0ea5e922,_transparent_60%)]" />

          <div className="relative p-6 md:p-7 flex flex-col h-full">
            {/* Title block */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-800/40 flex items-center justify-center border border-indigo-500/40">
                  <Container size={22} className="text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xl text-indigo-300 font-bold">
                    Underground Tank
                  </h4>
                  <p className="text-sm text-slate-400">
                    Ideal for household rainwater storage
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-700/40 text-indigo-200 border border-indigo-500/40 shadow-inner">
                82% Match
              </span>
            </div>

            {/* Match Bar */}
            <div className="w-full h-2 rounded-full bg-slate-700/50 mb-5 overflow-hidden">
              <div className="h-full w-[82%] bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"></div>
            </div>

            {/* Description */}
            <p className="text-slate-300/90 leading-relaxed text-sm mb-6">
              Designed to safely store harvested rainwater while preventing
              contamination and heat exposure.
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Volume */}
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <Gauge size={20} className="text-teal-300" />
                  <span className="text-teal-200 font-semibold text-sm">
                    Volume
                  </span>
                </div>
                <p className="text-slate-300 text-sm">
                  <strong>5,000 Liters</strong>
                </p>
              </div>

              {/* Dimensions */}
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <Ruler size={20} className="text-indigo-300" />
                  <span className="text-indigo-200 font-semibold text-sm">
                    Dimensions
                  </span>
                </div>
                <p className="text-slate-300 text-sm">
                  2.5m × 2.5m × 1.5m (L × W × H)
                </p>
              </div>
            </div>

            {/* 3D Preview Button */}
            <button
              onClick={() => setOpen(true)}
              className="mt-auto w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-800/40 border border-indigo-500/40 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] active:scale-[0.97] transition-all duration-200"
            >
              <CubeIcon width={22} className="text-white" />
              Preview 3D Structure
            </button>

            <p className="mt-5 text-sm text-slate-400/80 mb-1">
              The system is optimized for durability and groundwater-independent
              water use. dsadasd
            </p>
          </div>
        </div>
      </div>

      {/* 3D Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-2xl p-4 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-slate-300 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-slate-200 mb-3">
              Interactive 3D Storage Tank
            </h2>

            <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-700">
              <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <OrbitControls enableZoom={true} />
                <TankModel />
              </Canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
