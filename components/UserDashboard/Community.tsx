/* eslint-disable @next/next/no-img-element */
"use client";

import { MessageCircle, UserCircle2, Send, ArrowDown, X, Image as ImageIcon, Mic, Heart, StopCircle, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { auth, firestore, storage } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
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
  audioUrl?: string | null;
  likes?: string[];
  // Reply fields (optional for regular messages, present if it's a reply)
  replyToId?: string;
  replyToName?: string;
  replyToText?: string;
}

// Unified type for the feed
type FeedItem = Message;

interface OnlineUser {
  uid: string;
  fullName: string;
  photoURL?: string | null;
}

const Community = () => {
  const [messageQuery, setMessageQuery] = useState("");
  const [messages, setMessages] = useState<FeedItem[]>([]);
  const [replies, setReplies] = useState<FeedItem[]>([]); // Keep raw replies separate for merging
  const [feed, setFeed] = useState<FeedItem[]>([]); // The merged linear feed
  const [user, setUser] = useState<User | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Ensure reply fields are mapped if they differ in DB, but usually they match
      } as FeedItem));
      setReplies(data);
    });
  }, []);

  // Merge and Sort Feed
  useEffect(() => {
    const combined = [...messages, ...replies].sort((a, b) => {
      const tA = a.timestamp as { seconds: number } | undefined;
      const tB = b.timestamp as { seconds: number } | undefined;
      return (tA?.seconds || 0) - (tB?.seconds || 0);
    });
    setFeed(combined);
  }, [messages, replies]);

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
  }, [feed]);

  useEffect(() => {
    return () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioPreview]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    setShowScrollButton(container.scrollHeight - container.scrollTop > container.clientHeight + 80);
  };

  const uploadToCloudinary = async (file: File | Blob, resourceType: "image" | "video" | "auto" = "auto") => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

    console.log("Debug: Cloudinary Config", {
      cloudName: cloudName ? `${cloudName.substring(0, 3)}...` : "Missing",
      uploadPreset: uploadPreset ? "Set" : "Missing",
      resourceType
    });

    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary credentials missing");
      alert("Cloudinary credentials missing. Please check .env.local and restart the server.");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("resource_type", resourceType);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    console.log("Debug: Uploading to", url);

    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Cloudinary error response:", errorText);
        throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Debug: Upload success", data);
      if (data.secure_url) return data.secure_url;
      throw new Error(data.error?.message || "Upload failed");
    } catch (error) {
      console.error("Upload error details:", error);
      alert(`Upload failed: ${(error as Error).message}. Check console for details.`);
      return null;
    }
  };

  const handleLike = async (msgId: string, currentLikes: string[] = [], isReply = false) => {
    if (!user) return;
    const collectionName = isReply ? "replies" : "messages";
    const docRef = doc(firestore, collectionName, msgId);

    if (currentLikes.includes(user.uid)) {
      await updateDoc(docRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(docRef, { likes: arrayUnion(user.uid) });
    }
  };

  const handleDelete = async (msgId: string, isReply = false) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const collectionName = isReply ? "replies" : "messages";
      await deleteDoc(doc(firestore, collectionName, msgId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setAudioBlob(null);
    setAudioPreview(null);
  };

  const handleSend = async () => {
    if (!user) return;
    if (!messageQuery.trim() && !imageFile && !audioBlob) return;

    let imageUrl = null;
    let audioUrl = null;

    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile, "image");
    }

    if (audioBlob) {
      audioUrl = await uploadToCloudinary(audioBlob, "video"); // Cloudinary treats audio as video often, or use 'auto'
    }

    if (replyTo) {
      await addDoc(collection(firestore, "replies"), {
        text: messageQuery,
        senderId: user.uid,
        senderName: user.displayName || user.email || "Anonymous",
        senderPhotoURL: user.photoURL || null,
        timestamp: serverTimestamp(),
        replyToId: replyTo.id, // Store ID for scrolling
        replyToName: replyTo.senderName,
        replyToText: replyTo.text || (replyTo.imageUrl ? "Photo" : replyTo.audioUrl ? "Voice Message" : "Message"),
        messageId: replyTo.id, // Legacy support if needed, or just for reference
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        likes: [],
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
        audioUrl: audioUrl || null,
        likes: [],
      });
    }

    setMessageQuery("");
    setImageFile(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioPreview(null);
    setIsRecording(false);
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
        className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-semibold ${highlight ? "bg-emerald-600" : "bg-gray-500"
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
    const current = feed[index];
    const prev = feed[index - 1];
    if (!current || !prev) return false;
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

    // Highlight effect
    el.classList.add("ring-2", "ring-emerald-400", "bg-emerald-500/20", "transition-all", "duration-500");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-emerald-400", "bg-emerald-500/20");
    }, 1500);
  };

  return (
    <div className="flex flex-col md:flex-row h-[90vh] bg-[#0b141a] text-gray-100 overflow-hidden font-sans">
      {/* Background Pattern Overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
      </div>

      <div className="flex-1 flex flex-col relative z-0">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#202c33] border-b border-[#2f3b43] shadow-sm z-10">
          <div className="relative h-10 w-10 shrink-0">
            <div className="h-full w-full rounded-full bg-emerald-600 flex items-center justify-center text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-[#202c33]"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-100 text-base">Community Lounge</span>
            <span className="text-xs text-gray-400">
              {onlineUsers.length} member{onlineUsers.length === 1 ? "" : "s"} online
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-thumb-[#37404a] scrollbar-track-transparent"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {feed.length === 0 && (
            <div className="flex justify-center mt-12">
              <span className="bg-[#1f2c34] text-[#8696a0] text-xs px-4 py-2 rounded-lg shadow-sm">
                No messages yet. Say hi to everyone 👋
              </span>
            </div>
          )}

          {feed.map((msg, idx) => (
            <React.Fragment key={msg.id}>
              {shouldShowDateSeparator(idx) && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1.5 text-[11px] font-medium text-[#8696a0] bg-[#1f2c34] rounded-lg shadow-sm uppercase tracking-wide">
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
                  className={`flex items-end gap-2 md:gap-3 ${msg.senderId === user?.uid ? "justify-end" : "justify-start"
                    }`}
                >
                  {msg.senderId !== user?.uid &&
                    avatar(msg.senderPhotoURL, msg.senderName, false)}

                  <div
                    className={`relative max-w-[85%] md:max-w-[65%] px-2 py-1 rounded-lg shadow-sm text-sm group ${msg.senderId === user?.uid
                      ? "bg-[#005c4b] text-white rounded-tr-none"
                      : "bg-[#202c33] text-gray-100 rounded-tl-none"
                      }`}
                    onDoubleClick={() => setReplyTo(msg)}
                  >
                    {/* Tail for bubbles - simplified with CSS borders or just rounded corners logic above */}

                    {/* Reply Quote Block */}
                    {msg.replyToName && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (msg.replyToId) scrollToMessage(msg.replyToId);
                        }}
                        className="mb-1 rounded-md bg-black/20 border-l-4 border-[#00a884] px-2 py-1 cursor-pointer hover:bg-black/30 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-[#00a884]">{msg.replyToName}</p>
                        <p className="text-[10px] text-gray-300 line-clamp-1">{msg.replyToText || "Message"}</p>
                      </div>
                    )}

                    {msg.senderId !== user?.uid && (
                      <p className="text-[12px] font-bold text-[#00a884] mb-1 px-1">
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

                    {msg.audioUrl && (
                      <div className="mb-1 min-w-[200px]">
                        <audio controls src={msg.audioUrl} className="w-full h-8" />
                      </div>
                    )}

                    {msg.text && <p className="leading-relaxed px-1 pb-1">{msg.text}</p>}

                    <div className="flex items-center justify-end gap-1.5 mt-0.5 select-none">
                      <span className="text-[10px] text-gray-400/80 min-w-[45px] text-right">
                        {formatTime(msg.timestamp)}
                      </span>

                      {/* Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/20 rounded-full px-1">
                        <button
                          onClick={() => handleLike(msg.id, msg.likes)}
                          className={`p-1 hover:bg-white/10 rounded-full transition-colors ${msg.likes?.includes(user?.uid || "") ? "text-red-500" : "text-gray-400"
                            }`}
                          title="Like"
                        >
                          <Heart className={`h-3 w-3 ${msg.likes?.includes(user?.uid || "") ? "fill-current" : ""}`} />
                        </button>

                        <button
                          onClick={() => setReplyTo(msg)}
                          className="p-1 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                          title="Reply"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </button>

                        {msg.senderId === user?.uid && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Persistent Like Count if > 0 */}
                      {msg.likes && msg.likes.length > 0 && (
                        <div className="flex items-center gap-0.5 bg-black/20 rounded-full px-1.5 py-0.5">
                          <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                          <span className="text-[9px] text-gray-300">{msg.likes.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {msg.senderId === user?.uid &&
                  avatar(msg.senderPhotoURL, msg.senderName, true)}
              </div>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-20 right-4 bg-[#202c33] hover:bg-[#2a3942] p-2 rounded-full shadow-lg border border-[#2f3b43] text-[#00a884] transition-colors z-20"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}

        {/* Input Area */}
        <div className="bg-[#202c33] px-4 py-2 flex items-end gap-2 border-t border-[#2f3b43] z-20">

          {/* Reply Preview */}
          {replyTo && (
            <div className="absolute bottom-full left-0 right-0 bg-[#1f2c34] border-t border-[#2f3b43] p-2 flex items-center justify-between z-10 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-1 bg-[#00a884] rounded-full"></div>
                <div className="flex flex-col">
                  <span className="text-[#00a884] text-xs font-bold">Replying to {replyTo.senderName}</span>
                  <span className="text-gray-400 text-xs truncate max-w-[200px]">{replyTo.text || "Media"}</span>
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/5 rounded-full">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="absolute bottom-full left-4 mb-2">
              <div className="relative">
                <img src={imagePreview} className="h-20 w-20 object-cover rounded-lg border border-[#2f3b43]" alt="preview" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-[#202c33] rounded-full p-1 border border-[#2f3b43] shadow-sm"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Attachment Button */}
          <label className="p-2 text-[#8696a0] hover:text-gray-300 cursor-pointer transition-colors pb-3">
            <ImageIcon className="h-6 w-6" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center min-h-[42px] px-3 py-1.5 my-1">
            {isRecording ? (
              <div className="flex items-center gap-3 w-full animate-in fade-in">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-mono flex-1">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                </span>
                <button onClick={cancelRecording} className="text-[#8696a0] hover:text-red-400"><Trash2 className="h-5 w-5" /></button>
                <button onClick={stopRecording} className="text-[#00a884] hover:text-[#00c298]"><Send className="h-5 w-5" /></button>
              </div>
            ) : (
              <input
                type="text"
                value={messageQuery}
                onChange={(e) => setMessageQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message"
                className="w-full bg-transparent border-none outline-none text-gray-100 placeholder-[#8696a0] text-[15px]"
              />
            )}
          </div>

          {/* Mic or Send Button */}
          {!isRecording && (
            <button
              onClick={(!messageQuery.trim() && !imageFile && !audioBlob) ? startRecording : handleSend}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${(!messageQuery.trim() && !imageFile && !audioBlob)
                ? "bg-[#2a3942] text-[#8696a0] hover:bg-[#374248]" // Mic style
                : "bg-[#00a884] text-white hover:bg-[#008f6f]"     // Send style
                }`}
            >
              {(!messageQuery.trim() && !imageFile && !audioBlob) ? (
                <Mic className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5 pl-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sidebar - Group Info */}
      <div className="w-full md:w-80 border-l border-[#2f3b43] bg-[#111b21] hidden sm:flex flex-col">
        <div className="h-[60px] px-4 flex items-center bg-[#202c33] border-b border-[#2f3b43]">
          <span className="text-[#d1d7db] font-medium">Group Info</span>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="bg-[#111b21] rounded-lg mb-4">
            <h5 className="text-[#00a884] text-sm mb-4 px-2">Participants: {onlineUsers.length}</h5>
            <div className="space-y-1">
              {onlineUsers.map((u) => (
                <div key={u.uid} className="flex items-center gap-3 p-2 hover:bg-[#202c33] rounded-lg transition-colors cursor-pointer">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.fullName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
                      <UserCircle2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[#e9edef] text-sm font-normal">{u.uid === user?.uid ? "You" : u.fullName}</span>
                    <span className="text-[#8696a0] text-xs">online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {
        imageModalUrl && (
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
        )
      }
    </div >
  );
};

export default Community;
