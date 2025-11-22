"use client";

import React, { useState } from "react";

export default function Page() {
  const [form, setForm] = useState({
    roofArea: "",
    roofType: "",
    dwellers: "",
    space: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-gradient-to-br from-[#020817] via-[#0a1a2f] to-[#00121d] text-white relative overflow-hidden">
      <div className="flex">
        {/* glowing big background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />

        {/* heading */}
        <div className="p-8 mt-6 max-w-2xl">
          <h1 className="text-4xl font-extrabold text-cyan-400 drop-shadow-lg leading-tight">
            Free Rainwater Harvesting Assessment
          </h1>

          <p className="text-lg mt-3 text-blue-300 font-medium">
            Discover how much rainwater your rooftop can capture — and how much
            you can recharge back into the ground.
          </p>

          <p className="text-base mt-4 text-gray-300 leading-relaxed">
            This quick assessment analyzes your roof size, type, available
            space, and household usage to estimate the recharge potential.
            You’ll get a clear idea of tank size, recharge pit requirement, and
            the total rainwater you can save — completely free.
          </p>

          <p className="text-base mt-3 text-gray-400 italic">
            Make your home future-ready. Save water. Reduce dependence on
            municipal supply.
          </p>
        </div>

        <div className="mt-10 gap-8 p-10 shadow-[0_0_40px_rgba(0,255,255,0.15)] w-full max-w-3xl">
          <h1>Enter few details</h1>
          {/* form container */}
          <form className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 p-10 w-full max-w-3xl">
            {/* Input 1 */}
            <div className="relative">
              <label className="text-cyan-300 font-semibold mb-1 block">
                Roof Area (sq. ft.)
              </label>
              <input
                type="number"
                name="roofArea"
                placeholder="e.g. 120"
                value={form.roofArea}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#0b1b2b]/50 border border-cyan-500/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Input 2 */}
            <div className="relative">
              <label className="text-cyan-300 font-semibold mb-1 block">
                Roof Type
              </label>
              <select
                name="roofType"
                value={form.roofType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#0b1b2b]/50 border border-cyan-500/40 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              >
                <option value="">Select type</option>
                <option value="Flat">Flat</option>
                <option value="Sloped">Sloped</option>
                <option value="Tiled">Tiled</option>
                <option value="Concrete">Concrete</option>
                <option value="Metal">Metal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Input 3 */}
            <div className="relative">
              <label className="text-cyan-300 font-semibold mb-1 block">
                No. of Dwellers
              </label>
              <input
                type="number"
                name="dwellers"
                placeholder="e.g. 6"
                value={form.dwellers}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#0b1b2b]/50 border border-cyan-500/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>

            {/* Input 4 */}
            <div className="relative">
              <label className="text-cyan-300 font-semibold mb-1 block">
                Available Space (sq. ft.)
              </label>
              <input
                type="number"
                name="space"
                placeholder="e.g. 20"
                value={form.space}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#0b1b2b]/50 border border-cyan-500/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>

            {/* Submit button - center aligned full width */}
            <div className="col-span-1 sm:col-span-2 mt-4">
              <button
                type="submit"
                className="w-full py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-blue-600 hover:to-cyan-400 transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_35px_rgba(0,255,255,0.4)]"
              >
                Get Free Assessment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* footer */}
      <footer className="mt-10 text-gray-300 text-center text-sm">
        Powered by Sustainable Design · Next.js · Rainwater Intelligence
      </footer>
    </div>
  );
}
