"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Star,
  Clock,
  Slash,
  Check,
  X,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

// types.ts
export type PaymentMethod = "UPI" | "CASH" | "NONE";
export type PaymentStatus = "PENDING" | "INITIATED" | "SUCCESS" | "FAILED";

export interface MaintenanceRequest {
  // meta
  id?: string; // Firestore doc id (optional)
  userId?: string; // optional if you have auth
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp

  // application
  selectedDateISO: string; // e.g. "2025-11-01"
  selectedDateDisplay: string; // e.g. "1/11/2025"
  dayOfMonth: number; // 1..31
  scenarioId: number; // 1 | 2 | 3
  scenarioLabel: string; // "1st day bonus" | "Early month" | "Late month"

  // charges
  baseCharge: number; // e.g. 500
  rewardPoints: number; // points awarded (10/5/0)
  rewardDiscountCurrency: number; // numeric discount (we use same as points)
  finalPayable: number; // baseCharge - rewardDiscountCurrency

  // payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  upiId?: string; // if UPI used or shown
  transactionId?: string; // optional tx id returned by payment provider or generated locally
  paymentNote?: string;

  // UI flags (optional)
  applied: boolean;
  showQR?: boolean;
}

type Props = { baseCharge?: number };

export default function MaintenanceModernCompact({ baseCharge = 500 }: Props) {
  // const now = new Date();
  // const toISO = (d: Date) => d.toISOString().slice(0, 10);

  //   const [applied, setApplied] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [applyCash, setApplyCash] = useState(false);

  // Information from the Users
  const [mStatus, setMstatus] = useState("pending");
  // const [selectedDate, setSelectedDate] = useState<string>(toISO(now));
  const [name, setName] = useState("");
  const [location, setLocation] = useState({});
  const [phoneNumber, setPhoneNumber] = useState<number | string>();
  const [emailId, setEmailId] = useState("");
  const [payment, setPayment] = useState("");

  const [appliedAt, setAppliedAt] = useState<string | null>(null);

  const today = new Date();

  const year1 = today.getFullYear();
  const month1 = String(today.getMonth() + 1).padStart(2, "0");
  const day1 = String(today.getDate()).padStart(2, "0");

  const selectedDate = `${year1}-${month1}-${day1}`;

  // Parsed Date
  const parsed = new Date(selectedDate + "T00:00:00");
  // const parsed = new Date();
  const day = parsed.getDate();
  const month = parsed.getMonth() + 1;
  const year = parsed.getFullYear();

  // console.log(new Date().toISOString().slice(0, 10))

  // console.log(day)
  const [showQR, setShowQR] = useState(false);

  const lastDay = new Date(year, month, 0).getDate();
  const fmt = (d: number) => `${d}/${month}/${year}`;

  const scenario = useMemo(() => {
    if (day === 1) return { id: 1, points: 20, label: "1st day bonus" };
    if (day >= 2 && day <= 10)
      return { id: 2, points: 10, label: "Early month" };
    return { id: 3, points: 0, label: "Late month" };
  }, [day]);

  const finalAmount = Math.max(0, baseCharge - scenario.points);

  const items = [
    {
      id: 1,
      title: "Start of month",
      sub: "Apply exactly on 1st",
      dates: fmt(1),
      points: 20,
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: 2,
      title: "Early month",
      sub: "Apply between 2nd - 10th",
      dates: `${fmt(2)} — ${fmt(10)}`,
      points: 10,
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 3,
      title: "Late month",
      sub: "Apply after 10th",
      dates: `${fmt(11)} — ${fmt(lastDay)}`,
      points: 0,
      icon: <Slash className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      try {
        const userDoc = doc(firestore, "users", currentUser.uid);
        const userSnap = onSnapshot(userDoc, (snapshot) => {
          if (!snapshot.exists()) return;
          try {
            const data = snapshot.data();
            // setStatus(data.status);
            setName(data.fullName);
            setLocation({
              state: data.location.state,
              city: data.location.city,
              address: data.location.address,
            });
            setPhoneNumber(data.phoneNumber);
            setEmailId(data.email);
          } catch (e) {
            console.log(e);
          }
        });

        return () => userSnap();
      } catch (e) {
        console.log(e);
      }
    });

    return () => unsubscribe();
  });

  const applyForPay = () => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      try {
        const standardDoc = doc(firestore, "standard", currentUser.uid);
        await setDoc(
          standardDoc,
          {
            maintenanceRequest: {
              // --- USER DETAILS ---
              name: name,
              location: location,
              phoneNumber: phoneNumber,
              emailId: emailId,

              // --- MAINTENANCE DETAILS ---
              selectedDate: selectedDate,
              appliedAt: new Date().toISOString(),
              reward: scenario.points,
              label: scenario.label,
              charge: finalAmount,
              payment: payment,
            },
            mStatus: "processing",
          },
          { merge: true }
        );
      } catch (e) {
        console.log(e);
      }
    });
    alert("You have successfully applied for the payment.");
    return () => unsubscribe();
  };

  // ------------------------
  // 4) Auto reset mStatus -> 'pending' on the 1st day of the next month
  //    (checks appliedAt month vs current month, updates Firestore once)
  // ------------------------
  useEffect(() => {
    // helper: check if we are on day 1 and appliedAt is from previous month
    const shouldReset = () => {
      const now = new Date();
      if (now.getDate() !== 1) return false; // only run on 1st

      if (!appliedAt) {
        // if never applied we expect pending; if not pending, we can reset
        return mStatus !== "pending";
      }

      const appliedDate = new Date(appliedAt);
      const appliedMonth = appliedDate.getMonth();
      const appliedYear = appliedDate.getFullYear();

      return !(
        appliedYear === now.getFullYear() && appliedMonth === now.getMonth()
      );
    };

    const doReset = async () => {
      try {
        const authUnsub = onAuthStateChanged(auth, async (user) => {
          authUnsub();
          if (!user) return;

          const standardRef = doc(firestore, "standard", user.uid);

          await updateDoc(standardRef, {
            mStatus: "pending",
          });

          setMstatus("pending");
        });
      } catch (err) {
        console.error("Error resetting mStatus:", err);
      }
    };

    // run immediate check on mount
    if (shouldReset()) {
      doReset();
    }

    // schedule a daily midnight check (so if app open across midnight it'll catch)
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      5
    );
    const msUntil = nextMidnight.getTime() - now.getTime();

    let timer = setTimeout(function tick() {
      if (shouldReset()) doReset();
      timer = setTimeout(tick, 24 * 60 * 60 * 1000);
    }, msUntil);

    return () => clearTimeout(timer);
  }, [appliedAt, mStatus]); // re-run if appliedAt or mStatus change

  // console.log(mStatus);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;
      try {
        const standardDoc = doc(firestore, "standard", currentUser.uid);
        const standardSnap = onSnapshot(standardDoc, (snapshot) => {
          if (!snapshot.exists()) return;
          try {
            const data = snapshot.data();
            setMstatus(data.mStatus);

            // set appliedAt if present (maintenanceRequest.appliedAt)
            const applied = data?.maintenanceRequest?.appliedAt ?? null;
            setAppliedAt(applied);
          } catch (e) {
            console.log(e);
          }
        });

        return () => standardSnap();
      } catch (e) {
        console.log(e);
      }
    });

    return () => unsubscribe();
  });
  return (
    <div className="w-full min-h-[60vh] text-white rounded-2xl mb-10 pt-10">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-7">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Maintenance • Rewards
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              Pick a date — matching policy highlights.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {/* STATUS BADGE */}
            <div className="">
              {mStatus === "completed" ? (
                <span className="px-3 py-1.5 bg-emerald-800/30 text-emerald-300 border border-emerald-400/20 rounded-full text-xs font-semibold inline-flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Completed
                </span>
              ) : mStatus === "processing" ? (
                <span className="px-3 py-1.5 bg-blue-800/30 text-blue-300 border border-blue-400/20 rounded-full text-xs font-semibold inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Processing
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-yellow-800/30 text-yellow-300 border border-yellow-400/20 rounded-full text-xs font-semibold inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 px-2 py-1 rounded-md">
              {selectedDate}
            </div>
          </div>
        </div>

        {/* Visual band */}
        <div className="w-full h-9 rounded-lg overflow-hidden mb-4 border border-white/8 bg-white/5">
          <div className="h-full flex text-[11px]">
            <div className="flex-1 bg-amber-600/20 flex items-center justify-center text-amber-200">
              Day 1
            </div>
            <div className="flex-[3] bg-indigo-600/10 flex items-center justify-center text-indigo-200">
              Day 2–10
            </div>
            <div className="flex-[6] bg-slate-600/6 flex items-center justify-center text-slate-300">
              Day 11–{lastDay}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((it) => {
            const active = it.points === scenario.points;
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`w-full rounded-lg border p-3 flex items-start md:items-center justify-between gap-3
                  ${
                    active
                      ? "bg-gradient-to-r from-white/6 to-white/3 border-green-300 shadow-md"
                      : "bg-white/4 border-white/6"
                  }
                `}
                whileHover={{ y: active ? -3 : -1 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-md ${
                      active ? "bg-white/10" : "bg-white/6"
                    }`}
                  >
                    {it.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-semibold ${
                          active ? "text-white" : "text-slate-200"
                        }`}
                      >
                        {it.title}
                      </h3>
                      {active && (
                        <span className="text-[11px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{it.sub}</p>

                    <div className="mt-2 inline-flex items-center gap-2 bg-white/5 border border-white/8 px-2 py-1 rounded-full text-xs">
                      <Calendar className="w-3.5 h-3.5 text-indigo-200" />
                      <span className="text-emerald-200 font-medium">
                        {it.dates}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <motion.div
                    animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{
                      duration: 0.9,
                      repeat: active ? Infinity : 0,
                    }}
                    className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
                      active
                        ? "bg-emerald-900/25 border border-emerald-300/20"
                        : "bg-white/6 border border-white/8"
                    }`}
                    aria-hidden
                  >
                    <Star
                      className={`${
                        active ? "text-emerald-300" : "text-slate-300"
                      } w-4 h-4`}
                    />
                    <div
                      className={`text-sm font-bold ${
                        active ? "text-emerald-300" : "text-slate-200"
                      }`}
                    >
                      {it.points} pts
                    </div>
                  </motion.div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-300">Payable</div>
                    <div className="text-sm font-bold text-indigo-200">
                      ₹{Math.max(0, baseCharge - it.points)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-white/5 border border-white/8 rounded-lg p-3">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <div className="text-[11px] text-slate-300">Selected</div>
              <div className="font-medium">
                {selectedDate} • {scenario.label}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-300">Reward</div>
              <div className="font-medium text-emerald-300">
                {scenario.points} pts
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-300">Payable</div>
              <div className="font-medium text-indigo-200">₹{finalAmount}</div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <AnimatePresence>
              {mStatus == "pending" ? (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpenModal(true)}
                  className="w-full md:w-44 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md font-semibold text-sm shadow cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Apply
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full md:w-44 inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 rounded-md font-semibold text-sm"
                >
                  <Check className="w-4 h-4" />
                  Applied ✓
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ====================== MODAL ====================== */}
      <AnimatePresence>
        {openModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Choose Payment Method</h2>
                <X
                  className="w-5 h-5 cursor-pointer text-slate-300 hover:text-white"
                  onClick={() => {
                    setOpenModal(false);
                    setApplyCash(false);
                  }}
                />
              </div>

              {/* PAYMENT BREAKDOWN */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Maintenance Breakdown
                </h3>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Application Date</span>
                    <span className="text-white font-medium">
                      {selectedDate}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Reward Category</span>
                    <span className="text-emerald-300 font-medium">
                      {scenario.label}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Base Charge</span>
                    <span className="text-white font-medium">
                      ₹{baseCharge}-
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Reward Points</span>
                    <span className="text-emerald-300 font-medium">
                      - ₹{scenario.points}
                    </span>
                  </div>

                  <hr className="border-white/10 my-2" />

                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-white">
                      Final Payable
                    </span>
                    <span className="font-bold text-indigo-300">
                      ₹{finalAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 mt-4">
                <button
                  onClick={() => {
                    setShowQR(true); // open scanner modal
                    setApplyCash(false);
                    setPayment("UPI");
                    setMstatus("pending");
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2"
                >
                  UPI Payment
                </button>

                <button
                  onClick={() => {
                    setApplyCash(true);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer"
                >
                  Pay in Cash
                </button>

                {applyCash ? (
                  <button
                    onClick={() => {
                      setPayment("Cash");
                      setMstatus("processing");
                      //   setApplied(true);
                      setOpenModal(false);
                      applyForPay();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Apply for Cash Payment
                  </button>
                ) : (
                  ""
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Scan & Pay</h2>
                <X
                  className="w-5 h-5 cursor-pointer text-slate-300 hover:text-white"
                  onClick={() => setShowQR(false)}
                />
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-3 rounded-lg shadow-lg">
                  <QRCodeCanvas
                    value={`upi://pay?pa=mrakashsaha102@oksbi&pn=Maintenance Office&am=${finalAmount}&cu=INR&tn=Maintenance Payment`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>

                <p className="text-slate-300 text-xs mt-3">
                  Scan using Google Pay / PhonePe / Paytm / BHIM UPI
                </p>
              </div>

              {/* Divider */}
              <hr className="border-white/10 my-4" />

              {/* FALLBACK BUTTON */}
              <button
                onClick={() => {
                  const UPI_ID = "mrakashsaha102@oksbi";
                  const payeeName = "Maintenance Office";
                  const amount = finalAmount;
                  const note = "Maintenance Payment";

                  const upiLink = `upi://pay?pa=${encodeURIComponent(
                    UPI_ID
                  )}&pn=${encodeURIComponent(
                    payeeName
                  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

                  window.location.href = upiLink;
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2"
              >
                Pay Using UPI App
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
