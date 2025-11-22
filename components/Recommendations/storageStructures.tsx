"use client";

import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

interface RoofTopData {
  rooftop: {
    space: string;
  };
}

export default function StorageStructures() {
  const t = useTranslations("assessment");
  const [space, setSpace] = useState<number | null>(null);

  // ---------- STORAGE STRUCTURES BASED ON SPACE ----------
  const getDynamicStorage = (space: number | null) => {
    if (!space) return [];

    // Brutally honest logic: simple, practical, scalable
    // Adjust tank size based on rooftop area
    if (space < 20) {
      return [
        {
          type: "Small Underground Tank",
          dimension: "2m x 2m x 2m",
          capacity: "8,000 L",
        },
      ];
    }

    if (space < 50) {
      return [
        {
          type: "Medium Underground Tank",
          dimension: "3m x 3m x 2.5m",
          capacity: "22,500 L",
        },
      ];
    }

    // Default (large area)
    return [
      {
        type: "Underground Tank",
        dimension: "5m x 4m x 3m",
        capacity: "60,000 L",
      },
      {
        type: "Overhead Tank",
        dimension: "3m x 3m x 4m",
        capacity: "36,000 L",
      },
    ];
  };

  const storage = getDynamicStorage(space);

  // ---------------- FETCH USER DATA ----------------
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;

      const docRef = doc(firestore, "users", currentUser.uid);

      const unsubscribeSnap = onSnapshot(docRef, (snapshot) => {
        if (!snapshot.exists()) return;

        try {
          const data = snapshot.data() as RoofTopData;

          if (data?.rooftop?.space) {
            const rooftopSpace = Number(data.rooftop.space);
            if (!isNaN(rooftopSpace)) setSpace(rooftopSpace);
          }
        } catch (err) {
          console.log("Error parsing user rooftop data:", err);
        }
      });

      return unsubscribeSnap;
    });

    return unsubscribeAuth;
  }, []);

  // --------------- UI (UNCHANGED DESIGN) ----------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {storage.length === 0 && (
        <p className="text-white/70 text-sm">
          No storage structures available. Enter rooftop space first.
        </p>
      )}

      {storage.map((tank, idx) => (
        <div
          key={idx}
          className="relative bg-blue-900/20 backdrop-blur-md border-blue-500/30 p-6 rounded-2xl border transition transform shadow-lg"
        >
          <h5 className="text-xl font-bold text-blue-400 mb-3">{tank.type}</h5>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <strong>{t("dimension")}:</strong> {tank.dimension}
            </li>
            <li>
              <strong>{t("capacity")}:</strong> {tank.capacity}
            </li>
          </ul>

          <button className="mt-4 px-4 py-2 bg-sky-600/60 hover:bg-blue-500 text-white rounded-lg text-sm cursor-pointer">
            Learn More
          </button>
        </div>
      ))}
    </div>
  );
}
