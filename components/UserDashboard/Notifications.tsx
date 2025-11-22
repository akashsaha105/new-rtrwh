"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, onSnapshot, getDoc, setDoc } from "firebase/firestore";

import { Bell, AlertTriangle, CloudRain, Waves, Trash2 } from "lucide-react";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

interface NotificationItem {
  title: string;
  message: string;
  icon: string;
}

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("inactive");
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ==============================
  // Close popup on outside click
  // ==============================
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ==============================
  // Always push notification
  // ==============================
  const pushNotification = async (item: NotificationItem) => {
    if (!userId) return;

    try {
      const ref = doc(firestore, "notifications", userId);
      const snap = await getDoc(ref);

      const existing = snap.exists() ? snap.data().notifications || [] : [];

      // ✨ NEW: add item at the BOTTOM so order is bottom-to-top
      const updated = [...existing, item];

      await setDoc(ref, { notifications: updated }, { merge: true });

      setNotifications(updated);
      setOpen(true);
    } catch (e) {
      console.log("Push error:", e);
    }
  };

  // ==============================
  // Auth + Realtime Listeners
  // ==============================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;

      setUserId(currentUser.uid);

      const userRef = doc(firestore, "users", currentUser.uid);
      const notiRef = doc(firestore, "notifications", currentUser.uid);

      // USER STATUS LISTENER
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) return;

        const newStatus = snap.data().status ?? "inactive";

        setStatus(newStatus);

        // Fire notification ONLY IF status changed
        if (prevStatus !== null && prevStatus !== newStatus) {
          if (newStatus === "processing") {
            pushNotification({
              title: "Processing Started",
              message: "Your system is now processing.",
              icon: "AlertTriangle",
            });
          } else if (newStatus !== "inactive") {
            pushNotification({
              title: "System Ready",
              message: `Your system is active in ${newStatus} mode.`,
              icon: "CheckBadge",
            });
          }
        }

        setPrevStatus(newStatus);
      });

      // NOTIFICATION LIVE LISTENER
      const unsubNoti = onSnapshot(notiRef, (snap) => {
        if (!snap.exists()) {
          setNotifications([]);
          return;
        }

        const list = snap.data().notifications || [];

        // WE DISPLAY BOTTOM → TOP, so list stays in natural order
        setNotifications(list);
      });

      return () => {
        unsubUser();
        unsubNoti();
      };
    });

    return () => unsub();
  }, [prevStatus]);

  // ==============================
  // Delete Notification
  // ==============================
  const deleteNotification = async (index: number) => {
    if (!userId) return;

    try {
      const updated = [...notifications];
      updated.splice(index, 1);

      await updateDoc(doc(firestore, "notifications", userId), {
        notifications: updated,
      });

      setNotifications(updated);
    } catch (e) {
      console.log("Delete error:", e);
    }
  };

  // ==============================
  // ICON renderer
  // ==============================
  const renderIcon = (icon: string) => {
    switch (icon) {
      case "CloudRain":
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case "Waves":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case "AlertTriangle":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "CheckBadge":
        return <CheckBadgeIcon className="w-5 h-5 text-green-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-3 rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all shadow-md"
      >
        <Bell className="w-5 h-5 text-white" />

        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 bg-gray-900/80 text-white rounded-2xl shadow-xl backdrop-blur-xl border border-white/10"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h4 className="font-semibold text-sm tracking-wide">Alerts</h4>
            </div>

            {/* Bottom-to-top order → use flex-col-reverse */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 flex flex-col-reverse">
              {notifications.length === 0 && (
                <p className="p-4 text-sm text-gray-300 text-center">
                  No alerts available
                </p>
              )}

              {notifications.map((notify, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 p-3 hover:bg-white/10 transition"
                >
                  <div className="flex gap-3">
                    {renderIcon(notify.icon)}
                    <div>
                      <p className="font-semibold">{notify.title}</p>
                      <p className="text-xs text-gray-300">{notify.message}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteNotification(i)}
                    className="p-1 hover:bg-red-600/20 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
