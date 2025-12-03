"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/firebase";
import { format } from "date-fns";
import { Eye, CheckCircle, RefreshCw, Filter, Search, X } from "lucide-react";

type OrderDoc = {
  id: string;
  userId: string | null;
  _user: any;
  productId: string | null;
  _product: any;
  productName: string | null;
  productPrice: number;
  rewardPoints: number;
  payment: {
    mode: string;
    moneyPaid: number;
    pointsUsed: number;
  };
  orderStatus: string; // <-- IMPORTANT: Firestore field name
  createdAt: any;
  fullName: string;
  email: string;
  phoneNumber: string;
  geoPoint: {
    lat: number;
    long: number;
  };
  location: {
    state: string;
    city: string;
    address: string;
  };
  systemStatus: string;
  [key: string]: any;
};

const STATUS_STEPS = [
  "pending",
  "processing",
  "preparing",
  "dispatched",
  "delivered",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderDoc | null>(null);
  const [processing, setProcessing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    const ref = collection(firestore, "orders");
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as any) } as OrderDoc)
        );
        setOrders(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [refreshTick]);

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach((o) => {
      const s = (o.orderStatus ?? "Unknown").toString();
      m.set(s, (m.get(s) ?? 0) + 1);
    });
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "All" && (o.orderStatus ?? "") !== statusFilter)
        return false;
      if (!q) return true;
      const fields = [
        o.id,
        o.productName,
        o._product?.name,
        o.userId,
        o._user?.name,
        o.payment?.mode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [orders, search, statusFilter]);

  const safeFormat = (ts: any) => {
    try {
      if (ts?.toDate) return format(ts.toDate(), "yyyy-MM-dd HH:mm");
      if (typeof ts === "number")
        return format(new Date(ts), "yyyy-MM-dd HH:mm");
      return ts ?? "—";
    } catch {
      return "—";
    }
  };

  // 🔥 FIRESTORE writes to `orderStatus`
  const setStatus = async (id: string, newStatus: string) => {
    setProcessing(true);
    try {
      await runTransaction(firestore, async (tx) => {
        const ref = doc(firestore, "orders", id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Order not found");
        tx.update(ref, {
          orderStatus: newStatus,
          updatedAt: serverTimestamp(),
        });
      });
    } finally {
      setProcessing(false);
    }
  };

  const stepIndex = (s?: string) => {
    const val = (s ?? "").toLowerCase();
    return STATUS_STEPS.findIndex((x) => x.toLowerCase() === val) || 0;
  };

  const onNextStep = async (o: OrderDoc) => {
    const idx = stepIndex(o.orderStatus);
    if (idx >= STATUS_STEPS.length - 1) return;
    const next = STATUS_STEPS[idx + 1];
    await setStatus(o.id, next);
    setActiveOrder({ ...o, orderStatus: next });
  };

  const cancel = async (o: OrderDoc) => {
    if (!confirm(`Cancel order ${o.id}?`)) return;
    await setStatus(o.id, "Cancelled");
    setActiveOrder({ ...o, orderStatus: "Cancelled" });
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-900/5 to-emerald-900/3 shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-emerald-200 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-300" /> Orders — Admin
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="flex items-center bg-emerald-800/10 rounded-full px-3 py-1 gap-2">
            <Search className="w-4 h-4 text-emerald-200" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none text-sm px-2 text-emerald-100"
            />
          </div>

          {/* FILTER */}
          <div className="flex items-center gap-2 bg-emerald-800/10 rounded-md px-2 py-1">
            <Filter className="w-4 h-4 text-emerald-200" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm outline-none text-emerald-100"
            >
              <option value="All">All ({orders.length})</option>
              {Array.from(statusCounts.keys()).map((s) => (
                <option key={s} value={s}>
                  {s} ({statusCounts.get(s)})
                </option>
              ))}
              <option value="Cancelled">
                Cancelled ({statusCounts.get("Cancelled") ?? 0})
              </option>
            </select>
          </div>

          {/* REFRESH BUTTON */}
          <button
            onClick={() => {
              setRefreshTick((t) => t + 1);
              setLoading(true);
              setTimeout(() => setLoading(false), 700);
            }}
            className="px-3 py-2 rounded-md bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg bg-emerald-900/10 p-2">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-emerald-200/80">
              <th className="px-3 py-2">P_Id</th>
              <th className="px-3 py-2">P_Name</th>
              <th className="px-3 py-2">P_Price</th>
              <th className="px-3 py-2">P_Reward</th>
              <th className="px-3 py-2">C_Id</th>
              <th className="px-3 py-2">C_Payment</th>
              <th className="px-3 py-2">C_Reward</th>
              <th className="px-3 py-2">Status</th>
              {/* <th className="px-3 py-2">Created</th> */}
              {/* <th className="px-3 py-2">Customer</th> */}
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-emerald-300/70"
                >
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-emerald-800/10 hover:bg-emerald-900/5"
                >
                  <td className="px-3 py-3">{o.productId}</td>
                  <td className="px-3 py-3">
                    {o.productName ?? o._product?.name}
                  </td>
                  <td className="px-3 py-3">
                    ₹ {o.productPrice?.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">{o.rewardPoints ?? 0}</td>
                  <td className="px-3 py-3">{o.userId}</td>
                  <td className="px-3 py-3">
                    ₹{o.payment.moneyPaid.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">{o.payment.pointsUsed}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${badgeClass(
                        o.orderStatus
                      )}`}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  {/* <td className="px-3 py-3">{safeFormat(o.createdAt)}</td> */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => setActiveOrder(o)}
                      className="px-2 py-1 bg-emerald-800/30 rounded-md hover:bg-emerald-800/50"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {activeOrder && (
        <OrderModal
          activeOrder={activeOrder}
          safeFormat={safeFormat}
          processing={processing}
          onClose={() => setActiveOrder(null)}
          onNextStep={onNextStep}
          cancel={cancel}
        />
      )}
    </div>
  );
}

/* ⬇ MODAL (unchanged except status→orderStatus) */
function OrderModal({
  activeOrder,
  safeFormat,
  processing,
  onClose,
  onNextStep,
  cancel,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 pt-20">
      <div className="relative w-full max-w-xl bg-black text-white rounded-xl border border-gray-700 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">
            {activeOrder.productName ?? activeOrder._product?.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* ORDER DETAILS */}
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-4">
          <h4 className="text-sm text-gray-400 mb-2">Customer Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Full Name</span>
              <span>{activeOrder.fullName}</span>
            </div>

            <div className="flex justify-between">
              <span>Email</span>
              <span>{activeOrder.email}</span>
            </div>

            <div className="flex justify-between">
              <span>Phone Number</span>
              <span>{activeOrder.phoneNumber ?? 0}</span>
            </div>

            <div className="flex justify-between">
              <span>State</span>
              <span>{safeFormat(activeOrder.location.state)}</span>
            </div>
            <div className="flex justify-between">
              <span>City</span>
              <span>{safeFormat(activeOrder.location.city)}</span>
            </div>
            <div className="flex justify-between">
              <span>Address</span>
              <span>{safeFormat(activeOrder.location.address)}</span>
            </div>
          </div>
        </div>

        {/* PROGRESS STEPPER */}
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6">
          <Stepper
            steps={STATUS_STEPS}
            current={activeOrder.orderStatus ?? "Pending"}
            disabled={processing}
            onJump={async (s: any) => {
              if (s === activeOrder.orderStatus) return;
              if (!confirm(`Set status to "${s}"?`)) return;
              // await setStatus(activeOrder.id, s);
              activeOrder.orderStatus = s;
            }}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNextStep(activeOrder)}
            disabled={processing}
            className="py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700"
          >
            Next
          </button>

          <button
            onClick={() => cancel(activeOrder)}
            disabled={processing}
            className="py-3 rounded-lg bg-red-700/40 text-red-300 hover:bg-red-700/60"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Stepper ---------- */

function Stepper({ steps, current, onJump, disabled }: any) {
  const cur = (current ?? "").toLowerCase();
  const idx = Math.max(
    0,
    steps.findIndex((s: string) => s.toLowerCase() === cur)
  );

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((s: string, i: number) => {
          const active = i <= idx;
          return (
            <button
              key={s}
              disabled={disabled}
              onClick={() => onJump(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${
                active
                  ? "bg-emerald-500 text-black border-emerald-400"
                  : "bg-gray-800 text-gray-400 border-gray-700"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-emerald-400"
          style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function badgeClass(s?: string) {
  const st = (s ?? "").toLowerCase();
  if (st === "pending") return "bg-yellow-500/20 text-yellow-400";
  if (st === "processing") return "bg-blue-500/20 text-blue-400";
  if (st === "preparing") return "bg-indigo-500/20 text-indigo-300";
  if (st === "dispatched") return "bg-purple-500/20 text-purple-300";
  if (st === "delivered") return "bg-green-500/20 text-green-300";
  if (st === "cancelled") return "bg-red-500/20 text-red-400";
  return "bg-slate-500/20 text-slate-300";
}
