/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { MapPinIcon } from "@heroicons/react/16/solid";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import DetectArea from "./DetectArea";

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
  <div className="absolute z-50 top-5 left-80 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-3xl w-12/12 max-w-md flex justify-between py-3 px-4">
    <button
      onClick={() => setActiveTab("profile")}
      className={`flex-1 text-center py-2 mx-1 rounded-2xl font-medium transition-all ${
        activeTab === "profile"
          ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md"
          : "text-white/70 hover:bg-white/10"
      }`}
    >
      Profile
    </button>
    <button
      onClick={() => setActiveTab("rooftop")}
      className={`flex-1 text-center py-2 mx-1 rounded-2xl font-medium transition-all ${
        activeTab === "rooftop"
          ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md"
          : "text-white/70 hover:bg-white/10"
      }`}
    >
      Harvest
    </button>
    <button
      onClick={() => setActiveTab("detectRoofArea")}
      className={`flex-1 text-center py-2 mx-1 px-3 rounded-2xl font-medium transition-all ${
        activeTab === "detectRoofArea"
          ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md"
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

  const [userProfile, setUserProfile] = useState<FormData>({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    location: { state: "", city: "", address: "" },
  });

  const [userRoofTop, setUserRoofTop] = useState<RoofTopFormData>({
    rooftop: {
      area: "",
      type: "",
      runOffCoefficient: "",
      dwellers: "",
      space: "",
      soil: "",
    },
  });

  const [user, setUser] = useState<User | null>(null);
  const [photo, setPhoto] = useState("");

  const [formData, setFormData] = useState<FormData>(userProfile);
  const [rooftopFormData, setRooftopFormData] =
    useState<RoofTopFormData>(userRoofTop);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [rooftopSubmitted, setRooftopSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "state" || name === "city" || name === "address") {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value,
        },
      }));
      return;
    }

    // if (name === "state" || name === "city" || name === "address") {
    //   setFormData((prev) => ({
    //     ...prev,
    //     location: {
    //       ...prev.location,
    //       [name]: value,
    //     },
    //   }));
    // } else {
    //   setFormData((prev) => ({
    //     ...prev,
    //     [name]: value,
    //   }));
    // }
  };

  // Rooftop handler is okay
  const handleRooftopChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setRooftopFormData((prev) => {
      let newRunoff = prev.rooftop.runOffCoefficient; // keep existing by default

      if (name === "type") {
        newRunoff =
          value === "Flat"
            ? "0.7"
            : value === "Sloped"
            ? "0.9"
            : value === "Asbestos"
            ? "0.6"
            : value === "Metal Sheet Roof"
            ? "0.8"
            : value === "Bamboo Roof"
            ? "0.5"
            : "0.0";
      }

      return {
        ...prev,
        rooftop: {
          ...prev.rooftop,
          [name]: value,
          runOffCoefficient: newRunoff,
        },
      };
    });

    console.log(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const docRef = doc(firestore, "users", user.uid);
    const snap = await getDoc(docRef);

    const payload = {
      username: formData.username || user.displayName || "",
      fullName: formData.fullName || "",
      phoneNumber: formData.phoneNumber || "",
      location: {
        state: formData.location.state || "",
        city: formData.location.city || "",
        address: formData.location.address || "",
      },
      geopoint: [
        latitude !== null ? latitude : 0,
        longitude !== null ? longitude : 0,
      ],
    };

    if (!snap.exists()) await setDoc(docRef, payload);
    else await updateDoc(docRef, payload);

    if (formData.username && formData.username !== user.displayName) {
      await updateProfile(user, { displayName: formData.username });
    }

    const updatedSnap = await getDoc(docRef);

    if (updatedSnap.exists()) {
      const data = updatedSnap.data() as FormData;
      setUserProfile(data);
      setFormData(data);
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  // Submit rooftop
  const handleRooftopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const docRef = doc(firestore, "users", user.uid);

    await setDoc(docRef, { rooftop: rooftopFormData.rooftop }, { merge: true });

    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      setUserRoofTop({ rooftop: data.rooftop });
      setRooftopFormData({ rooftop: data.rooftop });
    }

    setRooftopSubmitted(true);
    setTimeout(() => setRooftopSubmitted(false), 2500);
  };

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

  // Fetch user on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);
      if (currentUser.photoURL) setPhoto(currentUser.photoURL);

      const docRef = doc(firestore, "users", currentUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as FormData & RoofTopFormData;

        setUserProfile({
          username: data.username || "",
          fullName: data.fullName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          location: {
            state: data.location?.state || "",
            city: data.location?.city || "",
            address: data.location?.address || "",
          },
        });

        setFormData({
          username: data.username || "",
          fullName: data.fullName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          location: {
            state: data.location?.state || "",
            city: data.location?.city || "",
            address: data.location?.address || "",
          },
        });

        setUserRoofTop({
          rooftop: data.rooftop || {
            area: "",
            type: "",
            dwellers: "",
            space: "",
            soil: "",
          },
        });

        setRooftopFormData({
          rooftop: data.rooftop || {
            area: "",
            type: "",
            dwellers: "",
            space: "",
            soil: "",
          },
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Detect location
  const detectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            location: {
              state: prev.location.state || data.address.state || "",
              city:
                prev.location.city ||
                data.address.city ||
                data.address.town ||
                data.address.village ||
                "",
              address: prev.location.address || data.display_name || "",
            },
          }));
        } catch (error) {
          console.error("Failed to fetch address:", error);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoadingLocation(false);
      }
    );
  };

  return (
    <div className="flex flex-row-reverse mt-3 mb-10">
      {/* Floating Navbar */}
      <FloatingNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Left Side: User Profile Card */}
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-10 mt-24">
        <div className="bg-gradient-to-r from-indigo-500 to-pink-500 p-1 rounded-2xl shadow-xl">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col md:flex-row items-center gap-6 p-6">
            {photo != "" ? (
              <img
                src={photo}
                width={130}
                height={130}
                alt="Profile Image"
                className="rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-500 text-white font-semibold">
                {user?.displayName?.[0]?.toUpperCase() || "G"}
              </div>
            )}
            <div className="flex flex-col flex-1 gap-2 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-200">
                {userProfile.fullName}
              </h1>
              <div className="flex flex-col gap-3 text-black mt-2">
                <span>📧 {userProfile.email}</span>
                <span>📞 {userProfile.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 text-black mt-1">
                🏠 {userProfile.location.address}
              </div>
            </div>
          </div>
        </div>
        {submitted && (
          <div className="mb-4 mt-5 p-3 bg-green-500/20 text-green-200 rounded-lg animate-pulse">
            ✅ Details updated successfully!
          </div>
        )}
      </div>

      {/* Right Side: Forms */}
      <div className="relative w-full flex flex-col ml-5 mt-23">
        {activeTab === "profile" && (
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg transition hover:shadow-indigo-400/40">
            <h2 className="text-2xl font-semibold text-white mb-6">
              ✨ Update Your Profile
            </h2>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Full Name + Username */}
              <div className="flex gap-3 max-w-full">
                <div className="flex flex-col gap-2 w-[120%]">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={toTitleCase(formData.fullName)}
                    onChange={handleChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-pink-400 outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 w-[100%]">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-pink-400 outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-pink-400 outline-none"
                  required
                />
              </div>

              {/* State + City */}
              <div className="flex gap-3 max-w-full">
                <div className="flex flex-col gap-2 w-[120%]">
                  <label>State</label>
                  <select
                    name="state"
                    value={formData.location.state}
                    onChange={handleChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-pink-400 outline-none"
                    required
                  >
                    <option value="" className="bg-white/100 text-gray-900">
                      Select State
                    </option>
                    {[
                      { id: 1, name: "West Bengal" },
                      { id: 2, name: "Maharastra" },
                      { id: 3, name: "Delhi" },
                    ].map((item) => (
                      <option
                        key={item.id}
                        value={item.name}
                        className="bg-white/100 text-gray-900"
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2 w-[100%]">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.location.city}
                    onChange={handleChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-pink-400 outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-2">
                <label>Address</label>
                <div className="flex gap-3 items-center">
                  <textarea
                    name="address"
                    value={formData.location.address}
                    onChange={handleChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 flex-1 resize-none focus:ring-2 focus:ring-pink-400 outline-none"
                    rows={2}
                    required
                  />
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-4 rounded-full min-w-[50px] h-15 flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                  >
                    {loadingLocation ? "..." : <MapPinIcon width={24} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold py-3 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {activeTab === "rooftop" && (
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg transition hover:shadow-indigo-400/40">
            <h2 className="text-2xl font-semibold text-white mb-6">
              🌇 Rooftop Rainwater Harvesting
            </h2>

            {rooftopSubmitted && (
              <div className="mb-4 p-3 bg-green-500/20 text-green-200 rounded-lg animate-pulse">
                ✅ Rooftop details submitted successfully!
              </div>
            )}

            <form
              className="flex flex-col gap-6 pb-3"
              onSubmit={handleRooftopSubmit}
            >
              {/* Basic Rooftop Inputs */}
              <div className="flex gap-5 max-w-full items-center">
                <div className="flex flex-col gap-2 w-[50%]">
                  <label>RoofTop Area (sq. ft.)*</label>
                  <input
                    type="text"
                    name="area"
                    placeholder="Enter rooftop area"
                    value={rooftopFormData.rooftop.area}
                    onChange={handleRooftopChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 w-[50%]">
                  <label>RoofTop Type*</label>
                  <div className="relative w-full">
                    <select
                      name="type"
                      value={rooftopFormData.rooftop.type}
                      onChange={handleRooftopChange}
                      className="appearance-none w-full p-3 pr-10 rounded-xl bg-gradient-to-r from-indigo-500/20 to-pink-500/20 
                text-white border border-white/30 shadow-md backdrop-blur-md 
                focus:ring-2 focus:ring-indigo-400 outline-none"
                      required
                    >
                      <option value="" className="bg-white/100 text-gray-900">
                        Select Rooftop Type
                      </option>
                      <option value="Flat" className="bg-white text-gray-900">
                        Flat
                      </option>
                      <option value="Sloped" className="bg-white text-gray-900">
                        Sloped
                      </option>
                      <option
                        value="Asbestos"
                        className="bg-white text-gray-900"
                      >
                        Asbestos
                      </option>
                      <option
                        value="Metal Sheet Roof"
                        className="bg-white text-gray-900"
                      >
                        Metal Sheet Roof
                      </option>
                      <option
                        value="Bamboo Roof"
                        className="bg-white text-gray-900"
                      >
                        Bamboo Roof
                      </option>
                    </select>

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* Dwellers + Space */}
              <div className="flex gap-5 max-w-full items-center">
                <div className="flex flex-col gap-2 w-[50%]">
                  <label>Number of Dwellers*</label>
                  <input
                    type="text"
                    name="dwellers"
                    placeholder="How many people live here?"
                    value={rooftopFormData.rooftop.dwellers}
                    onChange={handleRooftopChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 w-[50%]">
                  <label>Available Space (sq. ft.)*</label>
                  <input
                    type="text"
                    name="space"
                    placeholder="Open area for tank or pit"
                    value={rooftopFormData.rooftop.space}
                    onChange={handleRooftopChange}
                    className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Soil Type - Mandatory for recharge pit */}
              <div className="flex flex-col gap-2 w-full">
                <label>Soil Type (Optional)</label>
                <select
                  name="soil"
                  value={rooftopFormData.rooftop.soil}
                  onChange={handleRooftopChange}
                  className="p-3 rounded-xl bg-white/10 text-white placeholder-white/60 border border-white/30 
          focus:ring-2 focus:ring-indigo-400 outline-none w-full"
                >
                  <option value="" className="text-gray-900">
                    Select Soil Type
                  </option>
                  <option value="Sandy" className="text-gray-900">
                    Sandy
                  </option>
                  <option value="Loamy" className="text-gray-900">
                    Loamy
                  </option>
                  <option value="Clay" className="text-gray-900">
                    Clay
                  </option>
                  <option value="Silty" className="text-gray-900">
                    Silty
                  </option>
                  <option value="Rocky" className="text-gray-900">
                    Rocky
                  </option>
                </select>
              </div>

              {/* Demand Coverage Inputs */}
              <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">
                  💧 Water Demand
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label>Daily Water Consumption per Person (L)</label>
                    <input
                      type="number"
                      name="perPerson"
                      placeholder="E.g., 135"
                      className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3"
                      onChange={handleRooftopChange}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label>Days of Backup Required</label>
                    <input
                      type="number"
                      name="days"
                      placeholder="E.g., 3 Days"
                      className="bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl p-3"
                      onChange={handleRooftopChange}
                    />
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label>Usage Priority</label>
                    <select
                      name="priority"
                      className="p-3 rounded-xl bg-white/10 text-white border border-white/30 
              focus:ring-2 focus:ring-indigo-400 outline-none"
                      onChange={handleRooftopChange}
                    >
                      <option value="" className="text-gray-900">
                        Select Priority
                      </option>
                      <option value="Full Household" className="text-gray-900">
                        Full Household
                      </option>
                      <option value="Kitchen Only" className="text-gray-900">
                        Kitchen Only
                      </option>
                      <option value="Bathroom Only" className="text-gray-900">
                        Bathroom Only
                      </option>
                      <option
                        value="Garden / Cleaning"
                        className="text-gray-900"
                      >
                        Garden / Cleaning
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold py-3 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
              >
                Submit All Details
              </button>
            </form>
          </div>
        )}

        {activeTab === "detectRoofArea" && (
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg flex flex-col items-center justify-center">
            <p className="text-white mb-4 text-center">
              Click the button below to open the roof detection tool.
            </p>
            <button
              type="button"
              onClick={() => setIsDetectModalOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
            >
              Detect Roof Area
            </button>
          </div>
        )}
      </div>

      {/* Centered modal for DetectArea (not full screen) */}
      {isDetectModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center">
          <div className="relative w-[95vw] md:w-[80vw] lg:w-[70vw] h-[75vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setIsDetectModalOpen(false)}
              className="absolute top-3 right-3 z-[2100] bg-white/90 text-black px-3 py-1 rounded-full shadow hover:bg-white"
            >
              Close
            </button>
            <div className="w-full h-full">
              <DetectArea />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
