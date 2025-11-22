"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
// import Image from "next/image";

interface UserInfoProps {
  collapsed: boolean;
}

const UserInfo: React.FC<UserInfoProps> = ({ collapsed }) => {
  const [user, setUser] = useState<User | null>(null);
  const [photo, setPhoto] = useState("");
  const router = useRouter();

  // Handle auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
        console.log("User is not authenticated");
        return;
      }

      else {
        const isGoogle = currentUser.providerData.some(
          (p) => p.providerId === "google.com"
        );
  
        if (isGoogle || currentUser.emailVerified) {
          setUser(currentUser);
          if (currentUser.photoURL )setPhoto(currentUser.photoURL)
        } else {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  console.log(user)
  console.log(photo)
  
  return (
    <div
      className={`w-full relative rounded-xl px-4 py-3 cursor-pointer
        ${
          !collapsed
            ? "bg-white/10 backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-teal-500/20"
            : "right-0 p-10 ml-[-11] pe-13"
        } hover:bg-sky-500/20 hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0 w-10 h-10">
          {photo != "" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full object-cover transition-transform duration-300 hover:scale-110"
               // ✅ allow external URLs without next.config.js
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-500 text-white font-semibold">
              {user?.displayName?.[0]?.toUpperCase() || "G"}
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user?.displayName || "Guest User"}
          </p>
          <p className="text-xs text-sky-200/80 truncate">
            {user?.email || "guest@example.com"}
          </p>
        </div>
      </div>

      {/* Animated gradient line at bottom */}
      <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-300 group-hover:w-full rounded-b-xl"></span>
    </div>
  );
};

export default UserInfo;
