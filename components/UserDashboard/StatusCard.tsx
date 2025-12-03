/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { auth, firestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const StatusCard = ({status, setStatus}:{status: string,
    setStatus: (status: string) => void
}) => {

  useEffect(() => {
    const fetchStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setStatus(data.status || "");
        }
      } catch (error) {
        console.error("Error reading status:", error);
      }
    };

    fetchStatus();
  }, []);

  const getLabel = () => {
    if (status === "standard") return "🌱 Standard Plan Activated";
    if (status === "pro") return "🚀 Pro Plan Activated";
    return "❌ No Plan Activated";
  };

  const getColor = () => {
    if (status === "Standard") return "text-sky-300";
    if (status === "Pro") return "text-purple-300";
    return "text-red-300";
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
      <h4 className="text-lg font-semibold text-sky-200 mb-3">
        Installation Status
      </h4>

      <p className={`text-3xl font-bold ${getColor()}`}>
        {getLabel()}
      </p>

      <p className="text-sm text-gray-300 mt-2">
        Based on your selected installation plan.
      </p>
    </div>
  );
};

export default StatusCard;
