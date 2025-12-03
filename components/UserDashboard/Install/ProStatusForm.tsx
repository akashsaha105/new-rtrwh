/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState } from "react";
import { auth, firestore } from "@/firebase";
import { updateDoc, doc, setDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

/* === Types === */
interface Product {
  id: string;
  name: string;
  price: number;
  mandatory: boolean;
  short?: string;
  image?: string;
}

/* === Component === */
const ProStatusForm = () => {
  // Form state
  const [option, setOption] = useState<"storage" | "recharge" | "both" | "">(
    ""
  );
  const [waterLiters, setWaterLiters] = useState<string>("");
  // ensure mandatory items are initially selected
  const [selectedItems, setSelectedItems] = useState<string[]>(["tank", "pit"]);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [applyCash, setApplyCash] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [payment, setPayment] = useState("");

  // Product catalog (images provided inline — replace with your assets if desired)
  const products: Product[] = [
    {
      id: "tank",
      name: "Storage Tank (1000L)",
      price: 8500,
      mandatory: true,
      short: "High-density polyethylene cistern for safe storage.",
      image:
        "https://blogs.worldbank.org/content/dam/sites/blogs/img/detail/mgr/screen_shot_2020-11-09_at_5_13_46_pm.png",
    },
    {
      id: "pit",
      name: "Recharge Pit Construction",
      price: 4500,
      mandatory: true,
      short: "Precast concrete rings for effective groundwater recharge.",
      image:
        "https://erns72xipwt.exactdn.com/wp-content/uploads-new/2024/02/Recharge-well.jpg?strip=all&lossy=1&ssl=1",
    },
    {
      id: "sensor1",
      name: "Water Level Sensor",
      price: 1200,
      mandatory: false,
      short: "Automated level monitoring for tanks.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3RxTKUH5GZVOpO5VkggpJHSxJJEjVkARsMg&s",
    },
    {
      id: "sensor2",
      name: "Soil Moisture Sensor",
      price: 900,
      mandatory: false,
      short: "Monitors infiltration for recharge optimization.",
      image:
        "https://harishprojects.com/cdn/shop/files/SoilMoistureSensorModule_Buy2GetFree1ONOFFButton_harishprojects_14.webp?v=1735479553",
    },
    {
      id: "filter",
      name: "First Flush Filter",
      price: 1500,
      mandatory: false,
      short: "Removes first-run contaminants before storage.",
      image: "https://m.media-amazon.com/images/I/61WlteI-H4L.jpg",
    },
    {
      id: "pipes",
      name: "PVC Pipeline Set",
      price: 800,
      mandatory: false,
      short: "Durable piping for rooftop collection & transfer.",
      image: "https://m.media-amazon.com/images/I/61WlteI-H4L.jpg",
    },
    {
      id: "controller",
      name: "Automatic Motor Controller",
      price: 2500,
      mandatory: false,
      short: "Smart motor control for automated pumping.",
      image: "https://m.media-amazon.com/images/I/61WlteI-H4L.jpg",
    },
  ];

  // Partition products
  const mandatoryProducts = products.filter((p) => p.mandatory);
  const optionalProducts = products.filter((p) => !p.mandatory);

  // Toggle selection (cards/rows clickable)
  const toggleItem = (id: string) => {
    const mandatoryIds = mandatoryProducts.map((p) => p.id);
    if (mandatoryIds.includes(id)) return; // prevent removing mandatory items

    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Derived values
  const totalCost = useMemo(
    () =>
      selectedItems
        .map((id) => products.find((p) => p.id === id)?.price || 0)
        .reduce((a, b) => a + b, 0),
    [selectedItems]
  );

  const selectedCount = selectedItems.length;

  // const calculateDimensions = (liters: number) => {
  //   const cubicMeters = liters / 1000;
  //   const height = 1;
  //   const area = cubicMeters / height;

  //   const length = Math.sqrt(area * (2 / 3));
  //   const breadth = area / length;

  //   return `${length.toFixed(1)}m x ${breadth.toFixed(1)}m x ${height}m`;
  // };

  const handleSubmit = async () => {
    if (!waterLiters) {
      alert("Please fill water quantity (liters).");
      return;
    }

    const liters = Number(waterLiters);
    if (isNaN(liters) || liters <= 0) {
      alert("Enter a valid numeric value for liters.");
      return;
    }

    // alert("installed")
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      // const dimension = calculateDimensions(liters);

      const userDoc = doc(firestore, "users", user.uid);
      const purchaseRef = doc(firestore, "pro", user.uid);

      await updateDoc(userDoc, {
        mode: "pro"
      })

      await setDoc(purchaseRef, {
        selectedItems,
        totalCost,
        liters,
        createdAt: new Date(),
      });

      alert("Items saved & dimensions updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
    window.location.reload();
  };

  return (
    <section
      aria-labelledby="install-products-title"
      className="mx-auto p-6 md:p-8 rounded-3xl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2
            id="install-products-title"
            className="text-2xl md:text-3xl font-extrabold text-sky-300"
          >
            Installation Components — pro Plan
          </h2>
          <p className="mt-1 text-sm text-gray-300 max-w-2xl">
            Mandatory components are required and pre-selected. Below them are
            optional components — select any combination to customize your
            installation. Click a row or press <kbd>Enter</kbd> /{" "}
            <kbd>Space</kbd> to toggle selection.
          </p>
        </div>

        {/* summary pills */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-200">
            <div className="text-xs">Selected</div>
            <div className="text-sky-300 font-bold text-lg">
              {selectedCount}
            </div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-200 text-right">
            <div className="text-xs">Estimated Cost</div>
            <div className="text-sky-300 font-bold text-lg">₹ {totalCost}</div>
          </div>
        </div>
      </div>

      {/* Layout: list (left) + summary (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: lists (span 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mandatory List */}
          {/* Compact 2×2 Mandatory Grid (modern & compact) */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Required Components
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              These are pre-included in the pro installation. Click a card
              to view the specific parts and prices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Storage System */}
              <div className="rounded-2xl bg-white/3 border border-white/8 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-sky-700/30 rounded-lg flex items-center justify-center text-xl">
                      💧
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-semibold">
                          Storage System
                        </h4>
                        <p className="text-gray-300 text-sm mt-1">
                          Safe cistern for collected rainwater.
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-300">Included</div>
                        <div className="text-sky-300 font-semibold">
                          ₹ {mandatoryProducts[0].price}
                        </div>
                      </div>
                    </div>

                    {/* Details collapsed by default */}
                    <details className="mt-3" aria-label="Storage details">
                      <summary className="list-none cursor-pointer text-sm text-gray-200 hover:text-white">
                        View parts ▸
                      </summary>

                      <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/6">
                          <img
                            src={mandatoryProducts[0].image}
                            alt={mandatoryProducts[0].name}
                            className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-white font-medium">
                              {mandatoryProducts[0].name}
                            </div>
                            <div className="text-xs text-gray-400">
                              Capacity: 1000L (pro)
                            </div>
                          </div>
                          <div className="text-sky-300 font-semibold text-sm">
                            ₹ {mandatoryProducts[0].price}
                          </div>
                        </li>
                      </ul>
                    </details>

                    <div className="mt-3 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-pink-600/80 text-white">
                      🔒 Mandatory
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharge System */}
              <div className="rounded-2xl bg-white/3 border border-white/8 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-700/20 rounded-lg flex items-center justify-center text-xl">
                      🌱
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-semibold">
                          Groundwater Recharge
                        </h4>
                        <p className="text-gray-300 text-sm mt-1">
                          Channel overflow into recharge pit.
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-300">Included</div>
                        <div className="text-sky-300 font-semibold">
                          ₹ {mandatoryProducts[1].price}
                        </div>
                      </div>
                    </div>

                    <details className="mt-3" aria-label="Recharge details">
                      <summary className="list-none cursor-pointer text-sm text-gray-200 hover:text-white">
                        View parts ▸
                      </summary>

                      <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/6">
                          <img
                            src={mandatoryProducts[1].image}
                            alt={mandatoryProducts[1].name}
                            className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-white font-medium">
                              {mandatoryProducts[1].name}
                            </div>
                            <div className="text-xs text-gray-400">
                              Precast ring pit (pro)
                            </div>
                          </div>
                          <div className="text-sky-300 font-semibold text-sm">
                            ₹ {mandatoryProducts[1].price}
                          </div>
                        </li>
                      </ul>
                    </details>

                    <div className="mt-3 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-pink-600/80 text-white">
                      🔒 Mandatory
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtration */}
              <div className="rounded-2xl bg-white/3 border border-white/8 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-700/20 rounded-lg flex items-center justify-center text-xl">
                      🧪
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-semibold">
                          Filtration & First Flush
                        </h4>
                        <p className="text-gray-300 text-sm mt-1">
                          Removes debris and first-run contaminants.
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-300">Included</div>
                        <div className="text-sky-300 font-semibold">
                          ₹ 1,500
                        </div>
                      </div>
                    </div>

                    <details className="mt-3" aria-label="Filtration details">
                      <summary className="list-none cursor-pointer text-sm text-gray-200 hover:text-white">
                        View parts ▸
                      </summary>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/6">
                          <img
                            src="https://images.unsplash.com/photo-1582719478266-3d7a3c4ef3b4?auto=format&fit=crop&w=1200&q=60"
                            alt="First flush filter"
                            className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-white font-medium">
                              First Flush Filter
                            </div>
                            <div className="text-xs text-gray-400">
                              Sand + charcoal cartridge
                            </div>
                          </div>
                          <div className="text-sky-300 font-semibold text-sm">
                            ₹ 1,500
                          </div>
                        </li>
                      </ul>
                    </details>

                    <div className="mt-3 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-pink-600/80 text-white">
                      🔒 Mandatory
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitoring */}
              <div className="rounded-2xl bg-white/3 border border-white/8 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-700/20 rounded-lg flex items-center justify-center text-xl">
                      📡
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-semibold">
                          Tracking & Monitoring
                        </h4>
                        <p className="text-gray-300 text-sm mt-1">
                          Basic telemetry for tank & flow tracking.
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-300">Included</div>
                        <div className="text-sky-300 font-semibold">
                          ₹ Included
                        </div>
                      </div>
                    </div>

                    <details className="mt-3" aria-label="Monitoring details">
                      <summary className="list-none cursor-pointer text-sm text-gray-200 hover:text-white">
                        View parts ▸
                      </summary>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/6">
                          <img
                            src="https://images.unsplash.com/photo-1581093588401-6a35a8a584d9?auto=format&fit=crop&w=1200&q=60"
                            alt="Level sensor"
                            className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-white font-medium">
                              Basic Level Sensor
                            </div>
                            <div className="text-xs text-gray-400">
                              Battery-powered unit
                            </div>
                          </div>
                          <div className="text-sky-300 font-semibold text-sm">
                            Included
                          </div>
                        </li>
                      </ul>
                    </details>

                    <div className="mt-3 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-pink-600/80 text-white">
                      🔒 Mandatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional List (multiple select list) */}
          <div className="bg-white/5 rounded-2xl border border-white/8 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              Optional Components (Choose any)
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Add sensors and accessories to enhance automation and monitoring.
            </p>

            <ul className="space-y-2">
              {optionalProducts.map((p) => {
                const isSelected = selectedItems.includes(p.id);
                return (
                  <li
                    key={p.id}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleItem(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleItem(p.id);
                      }
                    }}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200
    ${
      isSelected
        ? "bg-sky-800/60 border border-sky-400 shadow-md"
        : "hover:bg-white/6 border border-white/6"
    }
  `}
                  >
                    {/* Circle selection indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-sky-400 bg-sky-500"
                          : "border-gray-500 bg-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full transition-transform scale-100" />
                      )}
                    </div>

                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-20 h-14 rounded-md object-cover flex-shrink-0"
                      loading="lazy"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-white font-semibold">
                            {p.name}
                          </div>
                          <div className="text-gray-300 text-sm mt-1">
                            {p.short}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sky-300 font-bold">
                            ₹ {p.price}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {isSelected ? "Included" : "Tap to add"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: summary + CTA */}
        <aside className="space-y-4">
          <div className="sticky top-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/8">
              <h4 className="text-sm text-gray-300">Summary</h4>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-gray-200">
                  <div>Components</div>
                  <div className="font-bold text-sky-300">{selectedCount}</div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-200 mt-2">
                  <div>Estimated cost</div>
                  <div className="font-bold text-sky-300">₹ {totalCost}</div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  You can modify optional items before saving. Mandatory items
                  are included by default.
                </div>
              </div>
            </div>

            {/* Water input */}
            {/* Water Quantity Slider */}
            <div className="mt-6 bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-200 font-medium">
                  Water Quantity (Liters)
                </label>

                {/* current value */}
                <span className="text-sky-300 font-semibold">
                  {waterLiters ? `${waterLiters} L` : "0 L"}
                </span>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min={0}
                max={Math.round(500.8)} // rooftop max potential
                value={Number(waterLiters) || 0}
                onChange={(e) => setWaterLiters(e.target.value)}
                className="
      w-full h-2 
      bg-white/10 
      rounded-lg 
      appearance-none 
      cursor-pointer
      accent-sky-500
      range-slider-thumb
    "
              />

              {/* Slider Meta */}
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0 L</span>
                <span>Max: {Math.round(500.8)} L</span>
              </div>

              {/* Description */}
              <div className="mt-3 text-xs text-gray-300 leading-relaxed">
                Drag the slider to set your expected water volume. This value
                will be used to calculate your recommended tank dimensions.
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4">
              <button
                onClick={() => setOpenModal(true)}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 text-white font-semibold shadow-lg hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Saving..." : "Get to Intall"}
              </button>

              <button
                onClick={() => {
                  // quick reset (keeps mandatory)
                  setSelectedItems(mandatoryProducts.map((p) => p.id));
                }}
                className="mt-3 w-full py-2 rounded-lg border border-white/8 hover:bg-black/5 text-sm text-gray-200 cursor-pointer"
              >
                Reset Optional Items
              </button>
            </div>

            {/* small note */}
            <div className="mt-4 text-xs text-gray-400">
              Prices are estimates. Final quote will be confirmed after a site
              visit.
            </div>
          </div>
        </aside>
      </div>

      {/* ====================== MODAL ====================== */}
      <AnimatePresence>
        {openModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Choose Payment Method</h2>
                <X
                  className="w-5 h-5 cursor-pointer text-slate-300 hover:text-white"
                  onClick={() => {
                    setOpenModal(false);
                    setApplyCash(false);
                  }}
                />
              </div>

              {/* PAYMENT BREAKDOWN */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Selected Components
                </h3>

                <div className="max-h-40 overflow-y-auto space-y-2 text-sm text-slate-300 pr-1">
                  {selectedItems.map((id) => {
                    const item = products.find((p) => p.id === id);
                    if (!item) return null;

                    return (
                      <div
                        key={id}
                        className="flex justify-between items-center"
                      >
                        <span>{item.name}</span>
                        <span className="text-indigo-300 font-medium">
                          ₹{item.price}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <hr className="border-white/10 my-3" />

                <div className="flex justify-between">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Total Cost
                </h3>
                  <span className="text-white text-sm">₹{totalCost}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 mt-4">
                <button
                  onClick={() => {
                    setShowQR(true); // open scanner modal
                    setApplyCash(false);
                    setPayment("UPI");
                    // setMstatus("pending");
                  }}
                  className={`w-full ${!applyCash ? "bg-indigo-600 hover:bg-indigo-700" : "bg-white/10 hover:bg-white/20"} py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer`}
                >
                  UPI Payment
                </button>

                <button
                  onClick={() => {
                    setApplyCash(true);
                  }}
                  className={`w-full ${applyCash ? "bg-indigo-600 hover:bg-indigo-700" : "bg-white/10 hover:bg-white/20"} py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer`}
                >
                  Pay in Cash
                </button>

                {applyCash ? (
                  <button
                    onClick={() => {
                      // setPayment("Cash");
                      //   setApplied(true);
                      setOpenModal(false);
                      handleSubmit();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Apply for Cash Payment
                  </button>
                ) : (
                  ""
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Scan & Pay</h2>
                <X
                  className="w-5 h-5 cursor-pointer text-slate-300 hover:text-white"
                  onClick={() => setShowQR(false)}
                />
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-3 rounded-lg shadow-lg">
                  <QRCodeCanvas
                    value={`upi://pay?pa=mrakashsaha102@oksbi&pn=Maintenance Office&am=${totalCost}&cu=INR&tn=Maintenance Payment`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>

                <p className="text-slate-300 text-xs mt-3">
                  Scan using Google Pay / PhonePe / Paytm / BHIM UPI
                </p>
              </div>

              {/* Divider */}
              <hr className="border-white/10 my-4" />

              {/* FALLBACK BUTTON */}
              <button
                onClick={() => {
                  const UPI_ID = "mrakashsaha102@oksbi";
                  const payeeName = "Maintenance Office";
                  const amount = totalCost;
                  const note = "Maintenance Payment";

                  const upiLink = `upi://pay?pa=${encodeURIComponent(
                    UPI_ID
                  )}&pn=${encodeURIComponent(
                    payeeName
                  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

                  window.location.href = upiLink;
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2"
              >
                Pay Using UPI App
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProStatusForm;
