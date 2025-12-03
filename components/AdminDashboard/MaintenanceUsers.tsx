/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Smartphone,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  increment,
} from "firebase/firestore";
import { firestore } from "@/firebase";

export default function MaintenanceUsers() {
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);

  // --------------------------------------------------------------------
  // 🔥 FETCH ALL MAINTENANCE ENTRIES FROM FIRESTORE
  // --------------------------------------------------------------------
  useEffect(() => {
    const standardCollection = collection(firestore, "standard");

    const unsubscribe = onSnapshot(standardCollection, (snapshot) => {
      const arr: any[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.maintenanceRequest) return;

        arr.push({
          id: docSnap.id, // uid
          ...data.maintenanceRequest,
          paymentStatus: data.mStatus,
        });
      });

      setMaintenanceList(arr);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------------------------
  // 🔥 ADMIN ACTIONS (UPGRADED)
  // --------------------------------------------------------------------
  const updateStatus = async (uid: string, newStatus: string) => {
    try {
      const standardRef = doc(firestore, "standard", uid);

      // Read current standard doc to decide whether to increment
      const standardSnap = await getDoc(standardRef);
      if (!standardSnap.exists()) {
        alert("User standard record not found.");
        return;
      }

      const standardData = standardSnap.data();
      const currentStatus: string | undefined = standardData?.mStatus;
      const maintenanceReq: any = standardData?.maintenanceRequest ?? {};
      const rewardPoints: number = Number(maintenanceReq?.reward ?? 0);

      // If we're moving to completed and the previous status was NOT completed -> increment reward
      const shouldIncrement =
        newStatus === "completed" && currentStatus !== "completed" && rewardPoints > 0;

      // 1) update standard doc status
      await updateDoc(standardRef, { mStatus: newStatus });

      // 2) increment user's reward in users collection if needed
      if (shouldIncrement) {
        try {
          const userRef = doc(firestore, "users", uid);
          await updateDoc(userRef, {
            // atomic increment; creates field if missing
            reward: increment(rewardPoints),
          });
        } catch (innerErr) {
          console.error("Failed to increment user reward:", innerErr);
          // We have already set mStatus to completed. Optionally you could roll back, but that's extra.
          alert("Status updated but failed to add reward points to user (see console).");
          return;
        }
      }

      alert(`Status updated to: ${newStatus}${shouldIncrement ? " — reward added" : ""}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // --------------------------------------------------------------------

  return (
    <div className="w-full min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Maintenance Tracking</h1>
          <p className="text-slate-300 text-sm mt-1">
            Admin panel • Real-time maintenance requests
          </p>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white/10 text-slate-300 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Charge</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {maintenanceList.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border-t border-white/10 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 font-medium">{row.name}</td>

                  <td className="px-4 py-3 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-indigo-300" />
                    {row.selectedDate}
                  </td>

                  <td className="px-4 py-3 text-slate-200">{row.reward}</td>

                  <td className="px-4 py-3 flex items-center gap-1 font-semibold">
                    <IndianRupee className="w-4 h-4" /> {row.charge}
                  </td>

                  <td className="px-4 py-3">
                    {row.payment === "upi" ? (
                      <div className="flex items-center gap-1 text-indigo-300">
                        <Smartphone className="w-4 h-4" /> UPI
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-300">
                        <Wallet className="w-4 h-4" /> Cash
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {row.paymentStatus === "completed" ? (
                      <span className="text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    ) : row.paymentStatus === "processing" ? (
                      <span className="text-yellow-300 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Processing
                      </span>
                    ) : (
                      <span className="text-red-300 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-400">
                    {row.appliedAt ? new Date(row.appliedAt).toLocaleString() : "—"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {/* PROCESSING */}
                      <button
                        onClick={() => updateStatus(row.id, "processing")}
                        className="px-2 py-1 text-xs bg-yellow-600/40 hover:bg-yellow-600/60 rounded-md"
                      >
                        Processing
                      </button>

                      {/* COMPLETED */}
                      <button
                        onClick={() => updateStatus(row.id, "completed")}
                        className="px-2 py-1 text-xs bg-emerald-600/40 hover:bg-emerald-600/60 rounded-md"
                      >
                        Completed
                      </button>

                      {/* RESET */}
                      <button
                        onClick={() => updateStatus(row.id, "pending")}
                        className="px-2 py-1 text-xs bg-red-600/40 hover:bg-red-600/60 rounded-md"
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
