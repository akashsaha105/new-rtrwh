/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { MapPinIcon } from "@heroicons/react/16/solid";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import DetectArea from "./DetectArea";
import ProfileForm from "./ProfileForm";
import RoofTopDetails from "./RoofTopDetails";

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface FormData {
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: {
    state: string;
    city: string;
    address: string;
  };
}

interface RoofTopFormData {
  rooftop: {
    area: string;
    type: string;
    runOffCoefficient: string;
    dwellers: string;
    space: string;
    soil: string;
  };
}

const FloatingNavbar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => (
  <div className="absolute z-50 top-5 left-80 transform -translate-x-1/2 border border-white/20 shadow-lg rounded-xl w-12/12 max-w-md flex justify-between py-3 px-4">
    <button
      onClick={() => setActiveTab("profile")}
      className={`flex-1 text-center py-2 mx-1 rounded-md font-medium transition-all cursor-pointer ${
        activeTab === "profile"
          ? "bg-teal-700 text-white shadow-md"
          : "text-white/70 hover:bg-white/10"
      }`}
    >
      Profile
    </button>
    <button
      onClick={() => setActiveTab("rooftop")}
      className={`flex-1 text-center py-2 mx-1 rounded-md font-medium transition-all cursor-pointer ${
        activeTab === "rooftop"
          ? "bg-teal-700 text-white shadow-md"
          : "text-white/70 hover:bg-white/10"
      }`}
    >
      Harvest
    </button>
    <button
      onClick={() => setActiveTab("detectRoofArea")}
      className={`flex-1 text-center py-2 mx-1 px-3 rounded-md font-medium transition-all cursor-pointer ${
        activeTab === "detectRoofArea"
          ? "bg-teal-700 text-white shadow-md"
          : "text-white/70 hover:bg-white/10"
      }`}
    >
      Detect Roof Area
    </button>
  </div>
);

const UserProfile = () => {
  const [isDetectModalOpen, setIsDetectModalOpen] = useState(false); // <-- modal state

  const [activeTab, setActiveTab] = useState("profile");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // AUTO-DETECT LOCATION IN BACKGROUND
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {
          setLatitude(0);
          setLongitude(0);
        }
      );
    } else {
      setLatitude(0);
      setLongitude(0);
    }
  }, []);

  return (
    <div className="flex flex-row-reverse mt-3 mb-10">
      {/* Floating Navbar */}
      <FloatingNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Right Side: Forms */}
      <div className="relative w-full flex flex-col ml-5 mt-23">
        {activeTab === "profile" && <ProfileForm />}

        {activeTab === "rooftop" && <RoofTopDetails />}

        {activeTab === "detectRoofArea" && (
          <div className="relative rounded-3xl p-6 flex flex-col items-center justify-center">
            <p className="text-white mb-4 text-center">
              Click the button below to open the roof detection tool.
            </p>
            <button
              type="button"
              onClick={() => setIsDetectModalOpen(true)}
              className="border border-blue-300 text-blue-100 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
            >
              Detect Roof Area
            </button>
          </div>
        )}
      </div>

      {/* Centered modal for DetectArea (not full screen) */}
      {isDetectModalOpen && (
        <div className="absolute inset-0 z-[2000] bg-black/60 flex items-center justify-center">
          <div
            className="relative 
                  w-[95vw] md:w-[80vw] lg:w-[70vw] 
                  h-[75vh] 
                  bg-black rounded-2xl overflow-hidden shadow-2xl
                  flex flex-col"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsDetectModalOpen(false)}
              className="absolute top-4 right-4 z-[2100] 
                 bg-white/90 text-black px-3 py-1 
                 rounded-full shadow hover:bg-white"
            >
              Close
            </button>

            {/* Content */}
            <div className="flex-1 w-full h-full">
              <DetectArea />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
