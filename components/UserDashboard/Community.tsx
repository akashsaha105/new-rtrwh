/* eslint-disable @next/next/no-img-element */
"use client";

import { MessageCircle, UserCircle2, Send, ArrowDown, X, Image as ImageIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { auth, firestore, storage } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string | null;
  timestamp?: unknown;
  imageUrl?: string | null;
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
  imageUrl?: string | null;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const q = query(collection(firestore, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(data);
    });
  }, []);

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
          imageUrl: data.imageUrl,
        };
        grouped[msgId] = grouped[msgId] ? [...grouped[msgId], reply] : [reply];
      });
      setReplies(grouped);
    });
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, replies]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    setShowScrollButton(container.scrollHeight - container.scrollTop > container.clientHeight + 80);
  };

  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const fileRef = ref(
      storage,
      `chat-images/${user?.uid ?? "anon"}/${Date.now()}-${imageFile.name}`
    );
    await uploadBytes(fileRef, imageFile);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  const handleSend = async () => {
    if (!user) return;
    if (!messageQuery.trim() && !imageFile) return;

    const imageUrl = await uploadImageIfNeeded();

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
        imageUrl: imageUrl || null,
      });
      setReplyTo(null);
    } else {
      await addDoc(collection(firestore, "messages"), {
        text: messageQuery,
        senderId: user.uid,
        senderName: user.displayName || user.email || "Anonymous",
        senderPhotoURL: user.photoURL || null,
        timestamp: serverTimestamp(),
        imageUrl: imageUrl || null,
      });
    }

    setMessageQuery("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setImagePreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const avatar = (photo: string | null | undefined, name: string, highlight: boolean) =>
    photo ? (
      <img src={photo} alt={name} className="h-8 w-8 rounded-full object-cover" />
    ) : (
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-semibold ${
          highlight ? "bg-emerald-600" : "bg-gray-500"
        }`}
      >
        {name[0]?.toUpperCase() || "U"}
      </div>
    );

  const formatTime = (ts?: unknown) => {
    if (!ts || typeof ts !== "object" || !("seconds" in ts)) return "";
    const date = new Date((ts as any).seconds * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts?: unknown) => {
    if (!ts || typeof ts !== "object" || !("seconds" in ts)) return "";
    const date = new Date((ts as any).seconds * 1000);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const current = messages[index];
    const prev = messages[index - 1];
    const currentDate = formatDate(current.timestamp);
    const prevDate = formatDate(prev.timestamp);
    return currentDate !== prevDate;
  };

  // Cancel reply on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReplyTo(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const scrollToMessage = (id: string) => {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // brief highlight effect
    el.classList.add("ring-2", "ring-emerald-400/70");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-emerald-400/70");
    }, 700);
  };

  return (
    <div className="flex flex-col md:flex-row h-[90vh] bg-[#020813] text-white overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col border-r border-white/5 bg-gradient-to-br from-slate-950/90 via-slate-950/95 to-black/95">
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/10 bg-black/50 backdrop-blur-lg">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 opacity-80" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-black/60">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm md:text-base">Community Lounge</span>
            <span className="text-[11px] text-emerald-300">
              {onlineUsers.length} member{onlineUsers.length === 1 ? "" : "s"} online
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span className="hidden md:inline">End‑to‑end style UI</span>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto space-y-3 px-2 md:px-4 py-3 md:py-4 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#020617_100%)]"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <p className="text-center text-gray-400 italic mt-12">
              No messages yet. Say hi to everyone 👋
            </p>
          )}

          {messages.map((msg, idx) => (
            <React.Fragment key={msg.id}>
              {shouldShowDateSeparator(idx) && (
                <div className="flex justify-center my-2">
                  <span className="px-3 py-1 text-[10px] uppercase tracking-wide rounded-full bg-black/60 text-gray-300 shadow-sm border border-white/5">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              )}

              <div
                ref={(el) => {
                  messageRefs.current[msg.id] = el;
                }}
                className="flex flex-col gap-1 transition-shadow duration-200"
              >
                <div
                  className={`flex items-end gap-2 md:gap-3 ${
                    msg.senderId === user?.uid ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.senderId !== user?.uid &&
                    avatar(msg.senderPhotoURL, msg.senderName, false)}

                  <div
                    className={`relative max-w-[75%] px-3 py-2 rounded-2xl shadow-lg text-sm group border border-white/5 transition-all duration-150 ease-out hover:-translate-y-[1px] ${
                      replyTo?.id === msg.id ? "ring-2 ring-emerald-400/70" : ""
                    } ${
                      msg.senderId === user?.uid
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-br-sm"
                        : "bg-slate-800/90 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.senderId === user?.uid ? (
                      <span className="absolute -right-1 bottom-0 h-3 w-3 bg-emerald-500 rounded-br-lg clip-path-bubble-right" />
                    ) : (
                      <span className="absolute -left-1 bottom-0 h-3 w-3 bg-slate-800 rounded-bl-lg clip-path-bubble-left" />
                    )}

                    {msg.senderId !== user?.uid && (
                      <p className="text-[11px] font-semibold text-emerald-300 mb-0.5">
                        {msg.senderName}
                      </p>
                    )}

                    {msg.imageUrl && (
                      <div className="mb-1 overflow-hidden rounded-lg border border-white/10">
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          className="max-h-64 w-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                          onClick={() => setImageModalUrl(msg.imageUrl || null)}
                        />
                      </div>
                    )}

                    {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}

                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <p className="text-[10px] text-gray-300">{formatTime(msg.timestamp)}</p>
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-emerald-100 bg-black/20 hover:bg-black/30 border border-emerald-400/40 transition-colors"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>

                  {msg.senderId === user?.uid &&
                    avatar(msg.senderPhotoURL, msg.senderName, true)}
                </div>

                {replies[msg.id]?.map((r) => (
                  <div
                    key={r.id}
                    className={`ml-10 flex items-start gap-2 md:gap-3 ${
                      r.senderId === user?.uid ? "justify-end flex-row-reverse md:flex-row-reverse" : ""
                    }`}
                  >
                    {r.senderId !== user?.uid &&
                      avatar(r.senderPhotoURL, r.senderName, false)}

                    <div
                      className={`px-3 py-2 rounded-2xl text-sm shadow-lg group max-w-[70%] border border-white/5 transition-transform duration-150 hover:-translate-y-[1px] ${
                        r.senderId === user?.uid
                          ? "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-br-sm"
                          : "bg-slate-800/90 text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToMessage(msg.id)}
                        className="mb-1 w-full text-left rounded-md bg-black/20 border-l-4 border-emerald-400/80 px-2 py-1 flex items-start gap-2 hover:bg-black/30 transition-colors cursor-pointer"
                      >
                        {msg.imageUrl && (
                          <div className="shrink-0">
                            <img
                              src={msg.imageUrl}
                              alt="replied to"
                              className="h-8 w-8 rounded-md object-cover border border-white/10"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                            {r.replyToName}
                            <span className="text-[9px] text-emerald-200/80">
                              • tap to view
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-300 truncate">
                            {r.replyToText}
                          </p>
                        </div>
                      </button>

                      {r.imageUrl && (
                        <div className="mb-1 overflow-hidden rounded-lg border border-white/10">
                          <img
                            src={r.imageUrl}
                            alt="reply attachment"
                            className="max-h-52 w-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                            onClick={() => setImageModalUrl(r.imageUrl || null)}
                          />
                        </div>
                      )}

                      {r.text && <p className="break-words leading-relaxed">{r.text}</p>}

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] text-gray-200">{r.senderName}</p>
                        <p className="text-[10px] text-gray-400">{formatTime(r.timestamp)}</p>
                      </div>
                    </div>

                    {r.senderId === user?.uid &&
                      avatar(r.senderPhotoURL, r.senderName, true)}
                  </div>
                ))}
              </div>
            </React.Fragment>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-24 right-4 md:right-6 bg-emerald-600/90 hover:bg-emerald-700 p-2.5 rounded-full shadow-xl border border-emerald-300/40"
          >
            <ArrowDown className="h-4 w-4 text-white" />
          </button>
        )}

        {replyTo && (
          <div className="mt-2 mb-1 mx-2 md:mx-4 flex items-start gap-2 text-xs bg-black/80 px-3 py-2 rounded-xl border border-emerald-500/70 shadow-lg">
            <div className="h-8 w-0.5 bg-emerald-500 rounded-full mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-emerald-300">
                  Replying to {replyTo.senderName}
                </span>
                <button
                  type="button"
                  onClick={() => scrollToMessage(replyTo.id)}
                  className="text-[10px] text-emerald-200 hover:underline"
                >
                  View
                </button>
              </div>
              <p className="text-[11px] text-gray-300 line-clamp-1">
                {replyTo.text || "Photo"}
              </p>
            </div>
            {replyTo.imageUrl && (
              <button
                type="button"
                onClick={() => setImageModalUrl(replyTo.imageUrl || null)}
                className="shrink-0"
              >
                <img
                  src={replyTo.imageUrl}
                  alt="replied to"
                  className="h-8 w-8 rounded-md object-cover border border-white/10"
                />
              </button>
            )}
            <button onClick={() => setReplyTo(null)} className="ml-1 mt-0.5">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}

        {imagePreview && (
          <div className="mt-1 mb-1 mx-2 md:mx-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-xl border border-white/10 shadow-lg">
            <img
              src={imagePreview}
              alt="preview"
              className="h-12 w-12 object-cover rounded-md border border-gray-700"
            />
            <span className="text-xs text-gray-300 flex-1 truncate">
              {imageFile?.name ?? "Selected image"}
            </span>
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}

        <div className="mt-2 px-2 md:px-4 pb-3">
          <div className="relative flex items-center gap-2 bg-cyan-600/10 border border-white/60 rounded-full px-3 py-1.5 shadow-xl backdrop-blur-md">
            <label className="cursor-pointer flex items-center justify-center h-9 w-9 rounded-full bg-slate-900 hover:bg-slate-800 border border-white/10 transition-colors">
              <ImageIcon className="h-5 w-5 text-emerald-400" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            <input
              type="text"
              value={messageQuery}
              onChange={(e) => setMessageQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 px-1"
            />

            <button
              onClick={handleSend}
              disabled={!messageQuery.trim() && !imageFile}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-72 border-l border-white/5 bg-black/70 backdrop-blur-xl hidden sm:flex flex-col">
        <div className="px-4 py-4 border-b border-white/10">
          <h4 className="text-sm font-semibold mb-1">Group details</h4>
          <p className="text-[11px] text-gray-400">
             number of online members 
          </p>
        </div>

        <div className="px-4 py-3">
          <h5 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Participants
          </h5>
          <ul className="space-y-2 max-h-[calc(90vh-140px)] overflow-y-auto pr-1">
            {onlineUsers.map((u) => (
              <li
                key={u.uid}
                className="flex items-center gap-3 bg-slate-950/80 hover:bg-slate-900/90 p-2 rounded-xl border border-white/5 transition-colors"
              >
                {u.photoURL ? (
                  <img
                    src={u.photoURL}
                    alt={u.fullName}
                    className="h-8 w-8 rounded-full object-cover border border-emerald-400/60"
                  />
                ) : (
                  <UserCircle2 className="h-8 w-8 text-emerald-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm">
                    {u.uid === user?.uid ? "You" : u.fullName}
                  </span>
                  <span className="text-[10px] text-emerald-400">online</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {imageModalUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={imageModalUrl}
              alt="full"
              className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <button
              className="absolute -top-3 -right-3 bg-black/80 rounded-full p-1"
              onClick={() => setImageModalUrl(null)}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
