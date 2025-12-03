/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  setDoc,
  collection,
} from "firebase/firestore";

import { Bell, AlertTriangle, CloudRain, Waves, Trash2 } from "lucide-react";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

interface NotificationItem {
  title: string;
  message: string;
  icon: string;
  imgLink?: string;
  ctaLink?: string;
}

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState(0);

  const previousStatus = useRef<string>("inactive");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ===========================================================
  // PUSH NOTIFICATION
  // ===========================================================
  const pushNotification = async (item: NotificationItem) => {
    if (!userId) return;

    try {
      const ref = doc(firestore, "notifications", userId);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data().notifications || [] : [];

      const updated = [item, ...existing];

      await setDoc(ref, { notifications: updated }, { merge: true });
      setNotifications(updated);

      // only update lastSeen if user actually got new notification
      await updateDoc(doc(firestore, "users", userId), {
        lastSeenNotification: Date.now(),
      });

      setOpen(true);
    } catch (e) {
      console.log("Push error:", e);
    }
  };

  // ===========================================================
  // AUTH + LOAD USER + LOAD NOTIFICATIONS
  // ===========================================================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentuser) => {
      if (!currentuser) return;
      setUserId(currentuser.uid);

      // fetch user's last seen
      const userRef = doc(firestore, "users", currentuser.uid);
      const userSnap = await getDoc(userRef);

      const seen = userSnap.data()?.lastSeenNotification || 0;
      setLastSeen(seen);

      // load notification list
      const notifRef = doc(firestore, "notifications", currentuser.uid);
      const notifSnap = await getDoc(notifRef);

      setNotifications(notifSnap.data()?.notifications || []);
    });

    return () => unsub();
  }, []);

  // ===========================================================
  // STATUS CHANGE DETECTOR
  // ===========================================================
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(firestore, "users", userId);

    let isHandling = false;

    const unsub = onSnapshot(userRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      if (isHandling) return; // 🧠 BLOCK loop re-entry

      const data = snapshot.data();
      const currentStatus = data.status;
      const lastStatusNotified = data.lastStatusNotified || "inactive";

      // no change → stop
      if (currentStatus === lastStatusNotified) return;

      // mark as handling to avoid second trigger
      isHandling = true;

      // fire notification
      if (currentStatus !== "inactive") {
        await pushNotification({
          title: "Status Updated",
          message: `Your status is now ${currentStatus}`,
          icon: "CheckBadge",
        });
      }

      // update server AFTER notification, and WITHOUT triggering snapshot loop
      await updateDoc(userRef, {
        lastStatusNotified: currentStatus,
      });

      // allow next snapshot after this finishes
      setTimeout(() => (isHandling = false), 50);
    });

    return () => unsub();
  }, [userId]);

  // ===========================================================
  // ADMIN BROADCAST LISTENER
  // ===========================================================
  useEffect(() => {
    if (!userId) return;

    const ref = collection(firestore, "admin-notification");

    const unsub = onSnapshot(ref, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;

        const data = change.doc.data();
        const createdAt = data.createdAt?.toMillis?.() || 0;

        if (createdAt <= lastSeen) return;

        if (
          data.sendTo === "all" ||
          (data.sendTo === "single" && data.userId === userId)
        ) {
          pushNotification({
            title: data.title,
            message: data.message,
            icon: data.type,
            imgLink: data.imageURL,
            ctaLink: data.ctaURL,
          });
        }
      });
    });

    return () => unsub();
  }, [userId, lastSeen]);

  // ===========================================================
  // DELETE NOTIFICATION
  // ===========================================================
  const deleteNotification = async (index: number) => {
    if (!userId) return;

    const updated = [...notifications];
    updated.splice(index, 1);

    await updateDoc(doc(firestore, "notifications", userId), {
      notifications: updated,
    });

    setNotifications(updated);
  };

  // ===========================================================
  // ICON SWITCHER
  // ===========================================================
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
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  // ===========================================================
  // UI
  // ===========================================================
  return (
    <div ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen(true);
          if (userId) {
            updateDoc(doc(firestore, "users", userId), {
              lastSeenNotification: Date.now(),
            });
          }
        }}
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-[9998]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="fixed z-[9999] top-0 right-0 h-screen w-[380px]
              bg-gray-900/95 backdrop-blur-2xl border-l border-white/10 
              shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h4 className="font-semibold text-lg tracking-wide">
                  Notifications
                </h4>

                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-md hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notifications.length === 0 && (
                  <p className="text-center text-gray-400 py-10">
                    No notifications available
                  </p>
                )}

                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className="relative bg-white/5 p-4 rounded-xl border 
                    border-white/10 shadow-lg hover:bg-white/10 transition space-y-3"
                  >
                    <button
                      onClick={() => deleteNotification(i)}
                      className="absolute top-2 right-2 p-1 hover:bg-red-600/20 rounded-md"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>

                    <div className="flex items-center gap-3">
                      {renderIcon(n.icon)}
                      <p className="font-semibold text-sm">{n.title}</p>
                    </div>

                    <p className="text-[12px] text-gray-300 leading-relaxed">
                      {n.message}
                    </p>

                    {n.imgLink && (
                      <img
                        src={n.imgLink}
                        className="w-full max-h-40 object-cover rounded-lg shadow-md"
                      />
                    )}

                    {n.ctaLink && (
                      <a
                        href={n.ctaLink}
                        target="_blank"
                        className="inline-block text-[11px] mt-1 font-medium 
                        text-indigo-300 hover:text-indigo-400 underline break-all"
                      >
                        {n.ctaLink}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
