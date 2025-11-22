/* eslint-disable @next/next/no-img-element */
"use client";

import { MessageCircle, UserCircle2, Send, ArrowDown, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { auth, firestore } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string | null;
  timestamp?: unknown;
}

interface Reply {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string | null;
  timestamp?: unknown;
  replyToName?: string;
  replyToText?: string;
}

interface OnlineUser {
  uid: string;
  fullName: string;
  photoURL?: string | null;
}

const Community = () => {
  const [messageQuery, setMessageQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [user, setUser] = useState<User | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Main messages listener
  useEffect(() => {
    const q = query(collection(firestore, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(data);
    });
  }, []);

  // Replies listener (global, not nested)
  useEffect(() => {
    const q = query(collection(firestore, "replies"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const grouped: Record<string, Reply[]> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Omit<Reply, "id"> & { messageId: string };
        const msgId = data.messageId;
        const reply: Reply = {
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhotoURL: data.senderPhotoURL,
          timestamp: data.timestamp,
          replyToName: data.replyToName,
          replyToText: data.replyToText,
        };
        grouped[msgId] = grouped[msgId] ? [...grouped[msgId], reply] : [reply];
      });
      setReplies(grouped);
    });
  }, []);

  // Online users listener
  useEffect(() => {
    return onSnapshot(collection(firestore, "users"), (snapshot) => {
      setOnlineUsers(
        snapshot.docs.map((d) => ({
          uid: d.data().uid,
          fullName: d.data().fullName || "User",
          photoURL: d.data().photoURL || null,
        }))
      );
    });
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, replies]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    setShowScrollButton(container.scrollHeight - container.scrollTop > container.clientHeight + 80);
  };

  const handleSend = async () => {
    if (!user || !messageQuery.trim()) return;

    if (replyTo) {
      await addDoc(collection(firestore, "replies"), {
        text: messageQuery,
        senderId: user.uid,
        senderName: user.displayName || user.email || "Anonymous",
        senderPhotoURL: user.photoURL || null,
        timestamp: serverTimestamp(),
        replyToName: replyTo.senderName,
        replyToText: replyTo.text,
        messageId: replyTo.id,
      });
      setReplyTo(null);
    } else {
      await addDoc(collection(firestore, "messages"), {
        text: messageQuery,
        senderId: user.uid,
        senderName: user.displayName || user.email || "Anonymous",
        senderPhotoURL: user.photoURL || null,
        timestamp: serverTimestamp(),
      });
    }

    setMessageQuery("");
  };

  const avatar = (photo: string | null | undefined, name: string, highlight: boolean) =>
    photo ? (
      <img src={photo} alt={name} className="h-8 w-8 rounded-full object-cover" />
    ) : (
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-semibold ${
          highlight ? "bg-indigo-600" : "bg-sky-500"
        }`}
      >
        {name[0]?.toUpperCase() || "U"}
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-[90vh] bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white overflow-hidden">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col p-6 backdrop-blur-lg bg-white/5 relative">
        <h3 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-indigo-400" /> Community Chat
        </h3>

        <div
          className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl bg-white/5 shadow-inner"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <p className="text-center text-gray-400 italic">No messages yet. Start the conversation 👇</p>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1">
              <div
                className={`flex items-end gap-3 ${
                  msg.senderId === user?.uid ? "justify-end" : "justify-start"
                }`}
              >
                {msg.senderId !== user?.uid &&
                  avatar(msg.senderPhotoURL, msg.senderName, false)}

                <div
                  className={`max-w-lg px-4 py-2 rounded-2xl shadow-md text-sm ${
                    msg.senderId === user?.uid
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {msg.text}
                  <p className="text-[10px] text-gray-300 mt-1">{msg.senderName}</p>
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="text-xs text-indigo-300 mt-1 hover:underline"
                  >
                    Reply
                  </button>
                </div>

                {msg.senderId === user?.uid &&
                  avatar(msg.senderPhotoURL, msg.senderName, true)}
              </div>

              {/* Replies */}
              {replies[msg.id]?.map((r) => (
                <div key={r.id} className="ml-10 flex items-start gap-3">
                  {r.senderId !== user?.uid &&
                    avatar(r.senderPhotoURL, r.senderName, false)}

                  <div
                    className={`px-3 py-2 rounded-xl text-sm shadow-sm ${
                      r.senderId === user?.uid ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    <p className="text-[10px] text-gray-400 mb-1">
                      Replying to {r.replyToName}: “{r.replyToText}”
                    </p>
                    {r.text}
                    <p className="text-[10px] text-gray-300 mt-1">{r.senderName}</p>
                  </div>

                  {r.senderId === user?.uid &&
                    avatar(r.senderPhotoURL, r.senderName, true)}
                </div>
              ))}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-28 right-6 bg-indigo-600 hover:bg-indigo-700 p-3 rounded-full shadow-lg"
          >
            <ArrowDown className="h-5 w-5 text-white" />
          </button>
        )}

        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-sm bg-gray-800 px-3 py-2 rounded">
            Replying to {replyTo.senderName}: &quot;{replyTo.text}&quot;
            <button onClick={() => setReplyTo(null)} className="ml-auto">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="mt-2 relative">
          <input
            type="text"
            value={messageQuery}
            onChange={(e) => setMessageQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="w-full pl-4 pr-14 py-3 rounded-full bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full"
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Online Users */}
      <div className="w-full md:w-64 border-l border-white/10 p-6 bg-white/5">
        <h4 className="text-xl font-semibold mb-4">Users</h4>
        <ul className="space-y-3">
          {onlineUsers.map((u) => (
            <li key={u.uid} className="flex items-center gap-3 bg-white/10 p-2 rounded-xl">
              {u.photoURL ? (
                <img src={u.photoURL} alt={u.fullName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <UserCircle2 className="h-8 w-8 text-indigo-400" />
              )}
              <span>{u.fullName}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Community;
