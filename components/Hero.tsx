"use client";
// import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Droplets,
  Zap,
} from "lucide-react";

import Demo from "@/components/Demo";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { openLoginModal } from "@/redux/slices/modalSlice";
import Link from "next/link";

function HandleLearnMore() {
  window.location.href =
    "https://cwas.org.in/resources/file_manager/module_3-3_1_rwh_guidelines.pdf";
}

export default function Hero({lang} : {lang: string}) {
  // const [isExpanded, setIsExpanded] = useState(false);
  const dispatch: AppDispatch = useDispatch()

  return (
    <section
      id="home"
      className="relative overflow-hidden min-h-screen flex items-center 10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto px-6">
        {/* Left Content */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0077b6] to-[#00b4d8]">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-[#00b4d8] uppercase tracking-wide">
                AI-Powered Assessment
              </span>
            </div>

            <h1 className="text-5xl md:text-5xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-white via-[#00b4d8] to-[#48bb78] bg-clip-text text-transparent">
                Assess Your Rooftop
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#48bb78] to-[#00b4d8] bg-clip-text text-transparent">
                Rainwater Harvesting
              </span>
              <br />
              <span className="text-white">Potential Instantly</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              AI-powered, on-spot assessment of rainwater harvesting and
              artificial recharge structures. Get instant calculations for
              optimal tank sizes and recharge potential.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              className="px-8 py-4 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white rounded-xl shadow-glow hover:scale-105 transform transition font-semibold text-lg flex items-center justify-center space-x-2 cursor-pointer"
              href={`${lang}/assessment`}
            >
              <Zap className="w-5 h-5" />
              <span>Try Free Assessment</span>
            </Link>

            <button
              className="px-8 py-4 glass border border-gray-600 text-white rounded-xl hover:scale-105 transform transition font-semibold text-lg"
              onClick={HandleLearnMore}
            >
              Learn More
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-3 gap-8 pt-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00b4d8]">40-60%</div>
              <div className="text-sm text-gray-400">Water Bill Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#48bb78]">1000+</div>
              <div className="text-sm text-gray-400">Liters Saved/Year</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0077b6]">5 Min</div>
              <div className="text-sm text-gray-400">Assessment Time</div>
            </div>
          </motion.div>
        </div>

        {/* Right Image */}

        <Demo />
      </div>
    </section>
  );
}
