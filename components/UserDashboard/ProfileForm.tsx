/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { MapPinIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import AutocompleteInput from "./AutoComplete";
import InlineCityInput from "./InlineCityInput";

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const cityList = [
  "Kolkata",
  "Delhi",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kalyani",
  "Howrah",
  "Durgapur",
];

const addressList = [
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Block A",
  "Block B",
  "Block C",
  "Near Railway Station",
  "Near Bus Stand",
  "Main Market Road",
  "Salt Lake City",
  "Rajarhat Newtown",
];

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

export default function ProfileForm() {
  /* ----- STATES ----- */
  const [user, setUser] = useState<User | null>(null);

  const [userProfile, setUserProfile] = useState<FormData>({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    location: { state: "", city: "", address: "" },
  });
  const [formData, setFormData] = useState<FormData>(userProfile);

  const [submitted, setSubmitted] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  /* ----------------------------------------------------------------
      FETCH USER FROM FIREBASE
  ---------------------------------------------------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      setUser(currentUser);
      const docRef = doc(firestore, "users", currentUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as FormData;
        setFormData(data);
      } else {
        setFormData((prev) => ({
          ...prev,
          username: currentUser.displayName || "",
          email: currentUser.email || "",
        }));
      }
    });

    return () => unsub();
  }, []);

  /* ----------------------------------------------------------------
  HANDLE INPUT CHANGES
  ---------------------------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Nested fields (location)
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

    // Normal fields
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ----------------------------------------------------------------
HANDLE FORM SUBMIT
---------------------------------------------------------------- */
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
      setFormData(data);
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };
  /* ----------------------------------------------------------------
    AUTO-DETECT LOCATION (ON MOUNT)
---------------------------------------------------------------- */
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
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();

          setFormData((prev) => ({
            ...prev,
            location: {
              state: data.principalSubdivision || prev.location.state || "",
              city:
                data.city ||
                data.locality ||
                prev.location.city ||
                "",
              address:
                (data.locality && data.principalSubdivision)
                  ? `${data.locality}, ${data.principalSubdivision}`
                  : (data.displayName || prev.location.address || ""),
            },
          }));
        } catch (err) {
          console.error("Address lookup failed:", err);
          alert("Could not fetch address details. Please enter manually.");
        } finally {
          setLoadingLocation(false);
        }
      },

      (error) => {
        console.error("Geolocation error:", error);
        setLoadingLocation(false);
        if (error.code === 1) {
          alert("Location access denied. Please enable permissions.");
        } else if (error.code === 2) {
          alert("Position unavailable. Check your network or GPS.");
        } else if (error.code === 3) {
          alert("Location request timed out.");
        } else {
          alert("An unknown error occurred while detecting location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full">
      {/* LEFT  — EDIT FORM  */}
      <div className="col-span-2 px-8 pt-2 w-150 rounded-2xl">
        <h2 className="text-2xl font-bold text-teal-300 mb-5 ml-3">
          Edit Profile
        </h2>

        <form
          className="flex flex-col gap-8 bg-slate-900/70 backdrop-blur-lg border border-slate-700 shadow-lg hover:shadow-xl rounded-2xl p-7"
          onSubmit={handleSubmit}
        >
          {/* FULL NAME + USERNAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-teal-300 mb-1">
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                value={toTitleCase(formData.fullName)}
                onChange={handleChange}
                placeholder="Enter full name"
                className="
              w-full p-3 rounded-lg
              bg-slate-900 text-white border border-slate-600
              focus:border-teal-400 outline-none transition
              placeholder:text-slate-500
            "
              />
            </div>

            {/* Username */}
            <div className="w-full">
              <label className="block text-sm font-medium text-teal-300 mb-1">
                Username
              </label>
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="@username"
                className="
              w-full p-3 rounded-lg
              bg-slate-900 text-white border border-slate-600
              focus:border-teal-400 outline-none transition
              placeholder:text-slate-500
            "
              />
            </div>
          </div>

          {/* PHONE */}
          <div>
            <label className="block text-sm font-medium text-teal-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="
            w-full p-3 rounded-lg
            bg-slate-900 text-white border border-slate-600
            focus:border-blue-400 outline-none transition
            placeholder:text-slate-500
          "
              required
            />
          </div>

          <div className="flex flex-col gap-6">
            {/* STATE + CITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* State */}
              <div className="w-full">
                <label className="block text-sm font-medium text-teal-300 mb-1">
                  State
                </label>

                <div className="relative">
                  <select
                    name="state"
                    value={formData.location.state}
                    onChange={handleChange}
                    className="
        w-full p-3 pr-10 rounded-lg
        bg-slate-900 text-white 
        border border-slate-600
        focus:border-teal-400 
        outline-none transition
        appearance-none
      "
                  >
                    <option value="" className="text-white">
                      Select State
                    </option>
                    <option value="West Bengal" className="text-white">
                      West Bengal
                    </option>
                    <option value="Maharastra" className="text-white">
                      Maharastra
                    </option>
                    <option value="Delhi" className="text-white">
                      Delhi
                    </option>
                  </select>

                  {/* Dropdown Arrow */}
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M6 8l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* City */}
              <div>
                {/* <label className="block text-sm font-medium text-teal-300 mb-1">
                  City
                </label> */}
                {/* <input
                  type="text"
                  name="city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="
              w-full p-3 rounded-lg
              bg-slate-900 text-white border border-slate-600
              focus:border-teal-400 outline-none transition
              placeholder:text-slate-500
            "
                /> */}

                <InlineCityInput
                  value={formData.location.city}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, city: val },
                    })
                  }
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div>
              {/* <label className="block text-sm font-medium text-teal-300 mb-1">
                Address
              </label> */}

              <div className="flex gap-4">
                {/* <textarea
                  name="address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="House No., Street, Locality"
                  className="
              flex-1 p-3 rounded-lg
              bg-slate-900 text-white border border-slate-600
              focus:border-blue-400 outline-none transition
              placeholder:text-slate-500 resize-none
            "
                  rows={3}
                /> */}

                <AutocompleteInput
                  label="Address"
                  name="address"
                  value={formData.location.address}
                  placeholder="House No., Street, Locality"
                  // suggestions={addressList}
                  onChange={handleChange}
                  onSelect={(value) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, address: value },
                    })
                  }
                />

                {/* Location Button */}
                <button
                  type="button"
                  onClick={detectLocation}
                  className="
              h-12 w-12 flex items-center justify-center rounded-lg border border-teal-500 text-teal-100 hover:bg-teal-600 hover:text-white cursor-pointer transition
            "
                >
                  {loadingLocation ? "…" : <MapPinIcon width={22} />}
                </button>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="
          text-teal-200 font-semibold py-3 rounded-lg border border-teal-300 
          transition tracking-wide hover:bg-teal-500 hover:text-white cursor-pointer
        "
          >
            Save Changes
          </button>

          {submitted && (
            <div className="p-3 text-sm rounded-lg bg-emerald-700/20 text-emerald-300 border border-emerald-500">
              Profile updated successfully ✔
            </div>
          )}
        </form>
      </div>

      {/* RIGHT — PROFILE SUMMARY */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-6">
          Profile Overview
        </h3>

        <div className="flex flex-col items-center gap-4">
          {/* Profile Picture */}
          <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-700">
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${formData.username || "user"
                }`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center">
            <h4 className="text-lg font-semibold text-white">
              {formData.fullName || "Your Name"}
            </h4>
            <p className="text-slate-400">@{formData.username || "username"}</p>

            <div className="mt-4 text-sm text-slate-400 space-y-1">
              <p>
                📍 {formData.location.city || "City"},{" "}
                {formData.location.state || "State"}
              </p>
              <p>🏠 {formData.location.address || "Address"}</p>
              <p>📞 {formData.phoneNumber || "+91 ————"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
