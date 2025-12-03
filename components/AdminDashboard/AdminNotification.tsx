"use client";

import { firestore } from "@/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import React, { useState } from "react";


export default function AdminNotification() {
  const [mode, setMode] = useState<"all" | "single">("all");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // const [notifications, setNotifications] = useState<Notification>();

  const handleSend = async () => {
    if (!title.trim()) return alert("Title cannot be empty.");
    if (!message.trim()) return alert("Message cannot be empty.");
    if (mode === "single" && !userId.trim()) return alert("Enter User ID.");

    try {
      setLoading(true);

      await addDoc(collection(firestore, "admin-notification"), {
        sendTo: mode,
        userId: mode === "single" ? userId : null,
        type,
        title,
        message,
        imageURL: imageUrl || null,
        ctaURL: ctaUrl || null,
        createdAt: serverTimestamp(),
      });

      alert("Notification Sent");
      setTitle("");
      setMessage("");
      setImageUrl("");
      setCtaUrl("");
    } catch (err) {
      console.error(err);
      alert("Error sending notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 tracking-wide">
        Send Notification
      </h2>

      {/* SECTION: Target Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 opacity-80">
          Recipient Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mode Selector */}
          <div>
            <label className="block mb-2 text-sm opacity-70">Send To</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "all" | "single")}
              className="w-full bg-white/10 border border-white/30 p-3 rounded-xl text-white backdrop-blur-md focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="all" className="text-black">
                All Users
              </option>
              <option value="single" className="text-black">
                Specific User
              </option>
            </select>
          </div>

          {/* User ID */}
          {mode === "single" && (
            <div>
              <label className="block mb-2 text-sm opacity-70">User ID</label>
              <input
                type="text"
                placeholder="Enter User ID"
                className="w-full bg-white/10 border border-white/30 p-3 rounded-xl text-white backdrop-blur-md focus:ring-2 focus:ring-indigo-400 outline-none"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Notification Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 opacity-80">
          Notification Type
        </h3>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-white/10 border border-white/30 p-3 rounded-xl text-white backdrop-blur-md focus:ring-2 focus:ring-indigo-400 outline-none"
        >
          <option value="general" className="text-black">
            General Update
          </option>
          <option value="scheme" className="text-black">
            Scheme
          </option>
          <option value="offer" className="text-black">
            Offer
          </option>
          <option value="reminder" className="text-black">
            Reminder
          </option>
          <option value="custom" className="text-black">
            Custom Message
          </option>
        </select>
      </div>

      {/* SECTION: Message Body */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-3 opacity-80">
          Message Content
        </h3>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block mb-2 text-sm opacity-70">Title</label>
            <input
              type="text"
              placeholder="Enter title"
              className="w-full bg-white/10 border border-white/30 p-3 rounded-xl text-white backdrop-blur-md focus:ring-2 focus:ring-indigo-400 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Full message */}
          <div>
            <label className="block mb-2 text-sm opacity-70">Message</label>
            <textarea
              placeholder="Enter detailed message"
              className="w-full bg-white/10 border border-white/30 p-3 rounded-xl h-32 text-white backdrop-blur-md resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SECTION: Optional Media */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-3 opacity-80">
          Optional Media
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Image URL */}
          <div>
            <label className="block mb-2 text-sm opacity-70">Image URL</label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              className="w-full bg-white/10 border border-white/30 p-3 rounded-xl text-white backdrop-blur-md focus:ring-2 focus:ring-indigo-400 outline-none"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* CTA URL */}
          <div>
            <label className="block mb-2 text-sm opacity-70">Button URL</label>
            <input
              type="text"
              placeholder="https://your-app.com/action"
              className="w-full bg-white/10 border border-white/30 p-3 rounded-xl text-white backdrop-blur-md focus:ring-2 focus:ring-indigo-400 outline-none"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 flex justify-center items-center font-semibold text-lg disabled:bg-indigo-600/40 backdrop-blur-md shadow-xl"
      >
        {loading ? "Sending..." : "Send Notification"}
      </button>
    </div>
  );
}
