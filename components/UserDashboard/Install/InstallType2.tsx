/* eslint-disable @next/next/no-img-element */
import { closeBasicModal, openProModal } from "@/redux/slices/modalSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Modal } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth, firestore } from "@/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import StandardStatusForm from "./StandardStatusForm";
import { onAuthStateChanged } from "firebase/auth";

const InstallType = ({
  standardPrice,
  proPrice,
  standardButton, // 👈 allow JSX element
  proButton,
}: {
  standardPrice: number | null;
  proPrice: number | null;
  standardButton: React.ReactNode;
  proButton: React.ReactNode;
}) => {
  const [status, setStatus] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;
      try {
        const userColl = doc(firestore, "users", currentUser.uid);
        const userSnap = onSnapshot(userColl, (snapshot) => {
          if (!snapshot.exists()) return;
          try {
            const data = snapshot.data();
            setStatus(data.status);
          } catch (e) {
            console.log(e);
          }
        });

        return () => userSnap();
      } catch (e) {
        console.log(e);
      }
    });

    return () => unsub();
  });
  return (
    <>
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-green-300 mb-6">Plan</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Standard Plan */}
          {status === "inactive" && (
            <div className="bg-gradient-to-br from-gray-800/40 to-sky-900/30 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl transition flex flex-col justify-between">
              <h4 className="text-xl font-semibold text-sky-200 mb-4 flex items-center gap-2">
                🌱 Standard Installation
              </h4>

              <p className="text-sm text-gray-300 mb-6">
                Ideal for households looking for a cost-effective way to harvest
                and use rainwater. Covers only essentials.
              </p>

              <ul className="space-y-3 text-gray-200">
                <li>✔ 1000–2000L Storage Tank</li>
                <li>✔ Basic Filtration Kit (Sand + Charcoal)</li>
                <li>✔ Plumbing & Gutter Pipes</li>
                <li>✔ First Flush Diverter</li>
                <li>✔ Recharge Pit (optional)</li>
              </ul>

              <div className="mt-6">
                <p className="text-3xl font-bold text-sky-300">
                  {standardPrice !== null ? `₹ ${standardPrice}` : "Loading..."}
                </p>
                <p className="text-sm text-gray-400">
                  One-time installation cost
                </p>
              </div>

              {standardButton}
            </div>
          )}

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-indigo-800/40 to-purple-900/30 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl transition">
            <h4 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
              🚀 Pro Installation
            </h4>

            <p className="text-sm text-gray-300 mb-6">
              Perfect for eco-conscious and tech-savvy users. Comes with smart
              features, automation, and remote control.
            </p>

            <ul className="space-y-3 text-gray-200">
              <li>✔ Everything in Standard Plan</li>
              <li>✔ IoT-Enabled Water Flow Sensor</li>
              <li>✔ Smart Redistribution</li>
              <li>✔ Alexa/Google Home Integration</li>
              <li>✔ Mobile App Control</li>
              <li>✔ Tank Alerts</li>
              <li>✔ Water Sharing Mode 🌍</li>
            </ul>

            <div className="mt-6">
              <p className="text-3xl font-bold text-purple-300">
                {proPrice !== null ? `₹ ${proPrice}` : "Loading..."}
              </p>
              <p className="text-sm text-gray-400">
                Advanced automation + lifetime dashboard
              </p>
            </div>

            {/* <button
                onClick={() => dispatch(openProModal())}
                className="mt-6 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition cursor-pointer"
              >
                Get Pro Plan
              </button> */}
            {proButton}
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallType;
