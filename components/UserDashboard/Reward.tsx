"use client";

import React, { useState } from "react";
import { DollarSign } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { auth, firestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RewardBadge() {
  const [count, setCount] = useState(0);
  // const reduction = "Rewards"
  // const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";

  React.useEffect(() => {
    const fetchReward = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(firestore, "users", user.uid);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setCount(data.reward || 0);
        }
      } catch (err) {
        console.error("Failed to fetch reward points", err);
      }
    };

    fetchReward();
  }, []);

  return (
    <div
      className="relative group cursor-pointer select-none"
      // onClick={() => router.push(`/${lang}/dashboard/reward`)}
    >
      {/* FULL BADGE */}
      <div
        className="
          flex justify-between items-center
          h-6
          bg-yellow-50
          border border-yellow-300/70
          rounded-full
          overflow-hidden
          transition-all
        "
      >
        {/* LEFT HALF: DIAMOND AREA */}
        <div
          className="
            flex items-center justify-center
            w-7 h-full rounded-full
            bg-gradient-to-br from-yellow-300 to-yellow-500
            border-r border-yellow-400/60
          "
        >
          <DollarSign className="w-3.5 h-3.5 text-yellow-900" />
        </div>

        {/* RIGHT HALF: POINTS */}
        <span className="px-3 text-yellow-900 font-bold text-sm pt-[1]">
          {count}
        </span>
      </div>

      {/* TOOLTIP */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2 mt-2
          hidden group-hover:block
          bg-gray-900 text-white text-xs
          px-3 py-1 rounded-md whitespace-nowrap shadow-lg z-20
        "
      >
        {/* Maintenance: {reduction} */}
        Reward Points
      </div>
    </div>
  );
}
