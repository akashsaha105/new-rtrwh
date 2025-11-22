"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Bell, AlertTriangle, CloudRain, Waves } from "lucide-react";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  // Alert states
  const [status, setStatus] = useState("inactive");
  const [rainAlert, setRainAlert] = useState(false);
  const [overflowAlert, setOverflowAlert] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ========================= CLICK OUTSIDE =========================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========================= FIRESTORE LISTENERS =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const userRef = doc(firestore, "users", user.uid);
      const notifRef = doc(firestore, "notifications", user.uid);

      // Listen for status updates
      const unSubStatus = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) return;
        const newStatus = snap.data().status;
        setStatus(newStatus);

        if (newStatus === "processing") setOpen(true);
        if (newStatus !== "inactive") setOpen(true); // AUTO OPEN
      });

      // Listen for rainfall + overflow
      const unSubNotifs = onSnapshot(notifRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data.rainDetector !== rainAlert) setOpen(true);
        if (data.overflowDetector !== overflowAlert) setOpen(true);

        setRainAlert(data.rainDetector);
        setOverflowAlert(data.overflowDetector);
      });

      return () => {
        unSubStatus();
        unSubNotifs();
      };
    });

    return () => unsubscribe();
  }, []);

  // ========================= COUNT =========================
  const totalAlerts = [
    status !== "inactive" && rainAlert,
    status !== "inactive" && overflowAlert,
    status === "processing" && status,
    status !== "inactive" && status !== "processing" && status,
  ].filter(Boolean).length;

  // ========================= UI =========================
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-3 rounded-full bg-white/10 backdrop-blur-lg 
                   hover:bg-white/20 transition-all shadow-md"
      >
        <Bell className="w-5 h-5 text-white" />

        {totalAlerts > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-600 text-white 
                           text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          >
            {totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -5 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-80 bg-gray-900/80 text-white 
                       rounded-2xl shadow-xl backdrop-blur-xl border border-white/10"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h4 className="font-semibold text-sm tracking-wide">Alerts</h4>

              {totalAlerts > 0 && (
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
              {totalAlerts === 0 ? (
                <p className="p-4 text-sm text-gray-300">No active alerts</p>
              ) : (
                <>
                  {/* Status */}
                  {status !== "inactive" && status !== "processing" && (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-800/70 to-gray-900/70 rounded-lg hover:from-gray-700/70 hover:to-gray-800/70 transition border border-white/10">
                      <div className="p-2 rounded-md bg-green-500/20 border border-green-400/30">
                        <CheckBadgeIcon className="w-5 h-5 text-green-400" />
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-green-300 tracking-wide">
                          System Mode Activated
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Your system is now installed in{" "}
                          <span className="font-bold text-green-200">
                            {status.toUpperCase()} Mode
                          </span>
                          .
                        </p>
                      </div>

                      <span className="px-2 py-1 text-[10px] bg-green-400/20 text-green-300 border border-green-500/40 rounded-md">
                        ACTIVE
                      </span>
                    </div>
                  )}

                  {status === "processing" && (
                    <div className="flex items-start gap-3 p-3 hover:bg-white/10 transition">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="font-semibold">System Alert</p>
                        <p className="text-xs text-gray-300">
                          Your system is now {status} for installation.{" "}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rain */}
                  {status !== "inactive" && rainAlert && (
                    <div className="flex items-start gap-3 p-3 hover:bg-white/10 transition">
                      <CloudRain className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-semibold">Rain Detected</p>
                        <p className="text-xs text-gray-300">
                          Rainfall sensor triggered
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Overflow */}
                  {status != "inactive" && overflowAlert && (
                    <div className="flex items-start gap-3 p-3 hover:bg-white/10 transition">
                      <Waves className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-semibold">Overflow Alert</p>
                        <p className="text-xs text-gray-300">
                          Storage tank is overflowing
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
