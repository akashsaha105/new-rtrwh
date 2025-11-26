"use client";

import React, { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { CheckCircle, Cog, Layers, Loader2 } from "lucide-react";

function parseDimensions(input: string) {
  if (!input) return { length: 0, width: 0, height: 0 };

  const clean = input.toLowerCase().replace(/\s+/g, "");
  const parts = clean.split("x");

  if (parts.length !== 3) return { length: 0, width: 0, height: 0 };

  const [l, w, h] = parts.map(Number);

  return {
    length: isNaN(l) ? 0 : l,
    width: isNaN(w) ? 0 : w,
    height: isNaN(h) ? 0 : h,
  };
}

export default function Page() {
  const { id } = useParams();
  const userId = id as string;

  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("pending"); // new default

  // const [rechargeDimension, setRechargeDimension] = useState("");
  const [rechargeLength, setRechargeLength] = useState("");
  const [rechargeWidth, setRechargeWidth] = useState("");
  const [rechargeDepth, setRechargeDepth] = useState("");
  const [infiltrationRate, setInfiltrationRate] = useState("");

  const [storageLength, setStorageLength] = useState("");
  const [storageWidth, setStorageWidth] = useState("");
  const [storageDepth, setStorageDepth] = useState("");

  // const [storageDimension, setStorageDimension] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ---------------- FETCHING USER MODE FROM FIRESTORE ----------------
  useEffect(() => {
    if (!userId) return;
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    const ref = doc(firestore, "users", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setMode(data.mode || "");
      setStatus(data.status || "pending");
    }
  };

  // ---------------- STEP PROCESSING ----------------
  const handleProcess = async () => {
    setLoading(true);

    // STEP 1 → Admin verifies user's chosen mode
    if (step === 1) {
      await updateDoc(doc(firestore, "users", userId), {
        status: "verifying",
      });
      setStatus("verifying");
    }

    // STEP 2 → Admin configures installation structure
    else if (step === 2) {
      const rechargeDims = `${rechargeLength} x ${rechargeWidth} x ${rechargeDepth}`
      const storagegeDims = `${storageLength} x ${storageWidth} x ${storageDepth}`

      const modeCollection = doc(firestore, mode, userId);
      await setDoc(
        modeCollection,
        {
          recharge: {
            dimension: rechargeDims,
            infiltrationRate: Number(infiltrationRate),
            sensorDistance: Number(rechargeDepth),
            overflow: false,
            overflowReading: 0,
          },
          storage: {
            dimension: storagegeDims,
            sensorDistance: Number(storageDepth),
            overflow: false,
            overflowReading: 0,
          },
        },
        { merge: true }
      );

      await updateDoc(doc(firestore, "users", userId), {
        status: "configuring",
      });

      setStatus("configuring");
    }

    // STEP 3 → Complete installation → ACTIVE MODE
    else if (step === 3) {
      const finalStatus = mode === "standard" ? "standard" : "pro";

      await updateDoc(doc(firestore, "users", userId), {
        status: finalStatus,
      });

      setStatus(finalStatus);
    }

    setLoading(false);
    if (step < 3) setStep(step + 1);
  };

  const stepText = ["Verify Mode", "Configure System", "Activate System"];
  const stepIcons = [
    <Cog key="1" className="h-6 w-6" />,
    <Layers key="2" className="h-6 w-6" />,
    <CheckCircle key="3" className="h-6 w-6" />,
  ];

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-slate-900 via-indigo-900 to-sky-900 text-white flex justify-center">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          Admin Installation Dashboard
        </h1>

        <div className="bg-black/20 p-4 rounded-xl mb-6">
          <p className="text-lg">
            <strong>User Mode Selected:</strong>{" "}
            <span className="text-yellow-300">{mode}</span>
          </p>
          <p className="text-lg">
            <strong>Installation Status:</strong>{" "}
            <span className="text-blue-300">{status}</span>
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10">
          {[1, 2, 3].map((s, index) => (
            <div
              key={s}
              className={`flex flex-col items-center ${
                step >= s ? "text-green-400" : "text-gray-500"
              }`}
            >
              <div
                className={`p-3 rounded-full border ${
                  step >= s
                    ? "border-green-400 bg-green-400/20"
                    : "border-gray-500"
                }`}
              >
                {stepIcons[index]}
              </div>
              <p className="mt-2 text-sm">{stepText[index]}</p>
            </div>
          ))}
        </div>

        {/* Step 2 forms */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-300">
                Recharge Dimension (m)
              </label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <input
                  type="number"
                  value={rechargeLength}
                  onChange={(e) => setRechargeLength(e.target.value)}
                  placeholder="L"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-blue-500"
                />
                <input
                  type="number"
                  value={rechargeWidth}
                  onChange={(e) => setRechargeWidth(e.target.value)}
                  placeholder="W"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-blue-500"
                />
                <input
                  type="number"
                  value={rechargeDepth}
                  onChange={(e) => setRechargeDepth(e.target.value)}
                  placeholder="D"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Infiltration Rate (mm/hr)
              </label>
              <input
                type="number"
                value={infiltrationRate}
                onChange={(e) => setInfiltrationRate(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg mt-1 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Storage Tank Dimension (m)
              </label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <input
                  type="number"
                  value={storageLength}
                  onChange={(e) => setStorageLength(e.target.value)}
                  placeholder="L"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-blue-500"
                />
                <input
                  type="number"
                  value={storageWidth}
                  onChange={(e) => setStorageWidth(e.target.value)}
                  placeholder="W"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-blue-500"
                />
                <input
                  type="number"
                  value={storageDepth}
                  onChange={(e) => setStorageDepth(e.target.value)}
                  placeholder="D"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={loading}
          className="w-full py-3 mt-10 rounded-xl bg-blue-600 hover:bg-blue-700 transition flex justify-center items-center gap-3"
        >
          {loading ? <Loader2 className="animate-spin" /> : ""}
          {step < 3 ? "Continue Installation" : "Activate System"}
        </button>
      </div>
    </div>
  );
}
