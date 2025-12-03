/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/firebase";
import { CheckCircle, Clock, Truck, Package } from "lucide-react";
import { format } from "date-fns";

interface OrderDoc {
  id: string;
  productName: string;
  amount: number;
  paymentMode: string;
  pointsUsed: number;
  orderStatus: "processing" | "preparing" | "dispatched" | "delivered";
  createdAt: any;
}

const UserOrders = ({ userId }: { userId: string }) => {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(firestore, "orders"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setOrders(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const getStatusUI = (s: OrderDoc["orderStatus"]) => {
    switch (s) {
      case "processing":
        return {
          text: "Order Processing",
          color: "text-yellow-400",
          icon: <Clock className="w-5 h-5 text-yellow-400" />,
        };
      case "preparing":
        return {
          text: "Preparing for Installation",
          color: "text-blue-400",
          icon: <Package className="w-5 h-5 text-blue-400" />,
        };
      case "dispatched":
        return {
          text: "Team on the Way",
          color: "text-purple-400",
          icon: <Truck className="w-5 h-5 text-purple-400" />,
        };
      case "delivered":
        return {
          text: "Installation Complete",
          color: "text-green-400",
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        };
      default:
        return { text: "Unknown", color: "text-gray-400", icon: null };
    }
  };

  const formatDate = (ts: any) => {
    try {
      if (ts?.toDate) return format(ts.toDate(), "yyyy-MM-dd HH:mm");
      return "—";
    } catch {
      return "—";
    }
  };

  if (loading) {
    return <div className="text-center text-gray-300 py-8">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        No orders found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-emerald-400">
        📦 Your Orders
      </h3>

      {orders.map((o) => {
        const statusUI = getStatusUI(o.orderStatus);

        return (
          <div
            key={o.id}
            className="p-5 rounded-xl bg-[#0e1a24] border border-white/10 shadow-lg hover:shadow-emerald-500/10 transition-all"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-white">{o.productName}</h4>
              <span className={`flex items-center gap-2 text-sm ${statusUI.color}`}>
                {statusUI.icon} {statusUI.text}
              </span>
            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
              <div>
                <div className="text-gray-400 text-xs">Order Amount</div>
                {/* ₹{o.amount.toLocaleString()} */}
                ₹{Number(1000).toLocaleString()}
              </div>

              <div>
                <div className="text-gray-400 text-xs">Reward Used</div>
                {o.pointsUsed} pts
              </div>

              <div>
                <div className="text-gray-400 text-xs">Payment Mode</div>
                {o.paymentMode}
              </div>

              <div>
                <div className="text-gray-400 text-xs">Ordered On</div>
                {formatDate(o.createdAt)}
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4">
              <TrackBar status={o.orderStatus} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserOrders;

const TrackBar = ({ status }: { status: OrderDoc["orderStatus"] }) => {
  const steps = ["processing", "preparing", "dispatched", "delivered"];

  const activeIndex = steps.indexOf(status);

  return (
    <div className="flex items-center gap-3 mt-3">
      {steps.map((step, i) => {
        const filled = i <= activeIndex;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                filled ? "bg-emerald-400" : "bg-gray-600"
              }`}
            ></div>

            {i < steps.length - 1 && (
              <div
                className={`w-10 h-1 rounded ${
                  filled ? "bg-emerald-400" : "bg-gray-700"
                }`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
};
