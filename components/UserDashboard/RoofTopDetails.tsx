/* eslint-disable @next/next/no-img-element */
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";

/* ----------------------------- types ----------------------------- */
type RoofType =
  | ""
  | "Flat"
  | "Sloped"
  | "Asbestos"
  | "Metal Sheet Roof"
  | "Bamboo Roof";

const SOIL_META = {
  Sandy: {
    label: "Sandy Soil",
    type: "High infiltration",
    desc: "Drains quickly — ideal for recharge pits.",
    img: "https://images.ctfassets.net/3s5io6mnxfqz/2NtZAbCMNH8DDAY7GQz2Gu/83ae589dc93ee115cc1b74bfb7c1db99/AdobeStock_271102263_2.jpeg?w=1920", // <-- replace with your image
  },
  Loamy: {
    label: "Loamy Soil",
    type: "Balanced permeability",
    desc: "— Very good for recharge structures.",
    img: "https://plantcaretoday.com/wp-content/uploads/garden-loam-good.jpg",
  },
  Clay: {
    label: "Clay Soil",
    type: "Low permeability",
    desc: "— Water drains slowly, larger pit needed.",
    img: "https://www.foundationrecoverysystems.com/wp-content/uploads/sites/6/2021/04/clay-soil.jpg",
  },
  Silty: {
    label: "Silty Soil",
    type: "Moderate drainage",
    desc: "— May need gravel support for recharge.",
    img: "https://www.epicgardening.com/wp-content/uploads/2020/10/Coarse-Ground-Surface.jpg",
  },
  Rocky: {
    label: "Rocky Soil",
    type: "Excellent deep percolation",
    desc: "Best for infiltration trenches.",
    img: "https://images.ctfassets.net/3s5io6mnxfqz/69mlWjnSRDlI9EpvlsMRsF/8486794eaa54a2d7e38bc06da501948b/AdobeStock_368458212.jpeg",
  },
} as const;

type SoilType = keyof typeof SOIL_META;

type RooftopForm = {
  area: string; // sqft
  type: RoofType;
  dwellers: string;
  space: string; // sqft
  soil: string;
  perPerson?: number;
  days?: number;
  priority?: string;
  runoffCoefficient?: number; // editable
  sampleRainfallMM?: number; // for preview estimate
};

/* ----------------------- roof type metadata ---------------------- */
const ROOF_META: Record<
  Exclude<RoofType, "">,
  { label: string; coeff: number; description: string; img: string }
> = {
  Flat: {
    label: "Flat Roof (RCC)",
    coeff: 0.85,
    description: "High runoff efficiency — best for harvesting.",
    img: "https://www.permaroof.co.uk/wp-content/uploads/2022/09/Flat-Roof-Extension.jpg", // add this
  },
  Sloped: {
    label: "Sloped Roof",
    coeff: 0.8,
    description: "Tile or sloped surface with moderate losses.",
    img: "https://api.gharpedia.com/wp-content/uploads/2018/08/020506010015-01-Pitched-Roof.jpg",
  },
  Asbestos: {
    label: "Asbestos Roof",
    coeff: 0.65,
    description: "Older roofing, moderate runoff quality.",
    img: "https://total-trades.co.uk/wp-content/uploads/2024/08/Sealing-an-Asbestos-Roof-How-Why-Explained.jpg",
  },
  "Metal Sheet Roof": {
    label: "Metal Sheet Roof",
    coeff: 0.95,
    description: "Extremely high runoff, ideal for harvesting.",
    img: "https://www.ultratechcement.com/content/ultratechcement/in/en/home/for-homebuilders/home-building-explained-single/descriptive-articles/types-of-roofing-sheet/_jcr_content/root/container/container_2072089177/teaser_copy_copy_cop_1954289592.coreimg.jpeg/1726483681618/roofing-sheet-2.jpeg",
  },
  "Bamboo Roof": {
    label: "Bamboo Roof",
    coeff: 0.55,
    description: "Lower efficiency, needs pre-filtering.",
    img: "https://i.pinimg.com/originals/5f/56/df/5f56dfe56ec351c8fbf17c94c3a393cf.jpg",
  },
};

/* ------------------------- small icons --------------------------- */
/* These are inline SVGs for simple visuals — swap with images if you have them */
function RoofIcon({ type }: { type: Exclude<RoofType, ""> }) {
  switch (type) {
    case "Flat":
      return (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
          <rect
            x="2"
            y="7"
            width="20"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect x="4" y="9" width="5" height="6" rx="0.5" fill="currentColor" />
          <rect
            x="11"
            y="9"
            width="9"
            height="6"
            rx="0.5"
            fill="currentColor"
            opacity="0.2"
          />
        </svg>
      );
    case "Sloped":
      return (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12 L12 4 L22 12 V20 H2z"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M6 20 V12 L12 8 L18 12 V20"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.4"
          />
        </svg>
      );
    case "Asbestos":
      return (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 7 H21 V17 H3z"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="currentColor"
            opacity="0.08"
          />
          <path
            d="M3 7 L21 17 M21 7 L3 17"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.4"
          />
        </svg>
      );
    case "Metal Sheet Roof":
      return (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M4 9 H20 M4 12 H20 M4 15 H20"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.7"
          />
        </svg>
      );
    case "Bamboo Roof":
      return (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12 C6 6 12 6 12 6 S18 6 22 12 V20 H2z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M6 18 C7 16 10 15 12 15 C14 15 17 16 18 18"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.6"
          />
        </svg>
      );
    default:
      return null;
  }
}

/* ------------------------ helper functions ------------------------ */
function sqftToM2(sqft: number) {
  return Math.max(0, sqft) * 0.092903;
}

/* estimate liters captured for a single event or month:
   formula: A(m2) * rainfall(mm) * Cr => liters */
function estimateLiters(areaSqft: number, rainfallMM: number, cr: number) {
  const areaM2 = sqftToM2(areaSqft);
  return Math.round(areaM2 * rainfallMM * cr);
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

export default function RoofTopDetails() {
  const [user, setUser] = useState<User | null>(null);
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

  const [rooftopFormData, setRooftopFormData] =
    useState<RoofTopFormData>(userRoofTop);

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

  // Fetch user on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);

      const docRef = doc(firestore, "users", currentUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as FormData & RoofTopFormData;
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
  const [rooftopSubmitted, setRooftopSubmitted] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<RooftopForm>({
    area: "",
    type: "",
    dwellers: "",
    space: "",
    soil: "",
    perPerson: 135,
    days: 3,
    priority: "Full Household",
    runoffCoefficient: undefined,
    sampleRainfallMM: 50,
  });

  /* whenever type changes, auto-fill the runoff coefficient */
  const onSelectType = (t: RoofType) => {
    const meta = t ? ROOF_META[t] : undefined;
    setForm((s) => ({
      ...s,
      type: t,
      runoffCoefficient: meta ? meta.coeff : s.runoffCoefficient,
    }));
  };

  /* generic input handler */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({
      ...s,
      [name]:
        name === "perPerson" || name === "days" || name === "sampleRainfallMM"
          ? Number(value)
          : value,
    }));
  };

  /* coefficient override (editable numeric input) */
  const handleCoeffChange = (v: string) => {
    const num = Number(v);
    setForm((s) => ({
      ...s,
      runoffCoefficient: isFinite(num) ? num : s.runoffCoefficient,
    }));
  };

  /* form submit (replace with Firestore sync) */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Minimal validation
    if (
      !rooftopFormData.rooftop.area ||
      !rooftopFormData.rooftop.type ||
      !rooftopFormData.rooftop.dwellers ||
      !rooftopFormData.rooftop.space
    ) {
      alert("Please complete required fields (area, type, dwellers, space).");
      return;
    }

    setSaving(true);
    try {
      // TODO: replace with your firestore setDoc or API call
      await new Promise((r) => setTimeout(r, 600)); // simulate network
      setRooftopSubmitted(true);
      setTimeout(() => setRooftopSubmitted(false), 2400);
    } catch (err) {
      console.error(err);
      alert("Failed to save — try again.");
    } finally {
      setSaving(false);
    }
  };

  /* computed values */
  const runoff =
    rooftopFormData.rooftop.runOffCoefficient ??
    (rooftopFormData.rooftop.type
      ? ROOF_META[rooftopFormData.rooftop.type as Exclude<RoofType, "">].coeff
      : 0);
  const areaNumeric = Number(rooftopFormData.rooftop.area || 0);
  const sampleRain = Number(form.sampleRainfallMM || 0);

  const harvestEstimate = useMemo(
    () => estimateLiters(areaNumeric, sampleRain, Number(runoff) || 0),
    [areaNumeric, sampleRain, runoff]
  );

  const dailyDemandPerPerson = Number(form.perPerson || 135);
  const daysBackup = Number(form.days || 3);
  const dwellersNum = Number(form.dwellers || 0);

  const requiredStorageL = useMemo(() => {
    return Math.round(dwellersNum * dailyDemandPerPerson * daysBackup);
  }, [dwellersNum, dailyDemandPerPerson, daysBackup]);

  /* quick friendly labels */
  const selectedMeta = rooftopFormData.rooftop.type
    ? ROOF_META[rooftopFormData.rooftop.type as Exclude<RoofType, "">]
    : undefined;

  return (
    <div className="relative py-6 px-3 shadow-2xl text-white">
      {/* header */}
      <div className="flex items-center justify-between gap-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-teal-300">
            Rooftop Rainwater Harvesting
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Provide rooftop details to estimate capture & storage needs. Photos
            help identify roof type.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-300">Sample Rainfall</div>
            <div className="text-lg font-semibold">{sampleRain} mm</div>
          </div>

          <div className="bg-white/6 px-3 py-2 rounded-xl text-sm">
            <div className="text-xs text-slate-300">Harvest (sample)</div>
            <div className="text-lg font-semibold">
              {harvestEstimate.toLocaleString()} L
            </div>
          </div>
        </div>
      </div>

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        onSubmit={handleRooftopSubmit}
      >
        {/* left: inputs */}
        <div className="space-y-4 ">
          {/* area & roof type */}
          <div className="p-4 bg-slate-900/70 backdrop-blur-lg border-slate-700 shadow-lg hover:shadow-xl rounded-2xl border">
            <label className="text-sm text-teal-300">
              RoofTop Area (sq. ft.)*
            </label>
            <input
              name="area"
              value={rooftopFormData.rooftop.area}
              onChange={handleRooftopChange}
              inputMode="numeric"
              className="mt-2 w-full p-3 bg-transparent border border-white/10 rounded-md outline-none focus:border-teal-300"
              placeholder="e.g., 1000"
              required
            />

            <div className="mt-4">
              <label className="text-sm text-teal-300">RoofTop Type*</label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {(Object.keys(ROOF_META) as Exclude<RoofType, "">[]).map(
                  (t) => {
                    const selected = rooftopFormData.rooftop.type === t;

                    return (
                      <label
                        key={t}
                        className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition 
            ${
              selected
                ? "bg-indigo-600/20 border-indigo-400 shadow-md"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
                      >
                        {/* Hidden Radio Input */}
                        <input
                          type="radio"
                          name="type"
                          value={t}
                          checked={selected}
                          onChange={handleRooftopChange}
                          className="hidden"
                        />

                        {/* Roof Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img
                            src={ROOF_META[t].img}
                            alt={ROOF_META[t].label}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold text-white">
                            {ROOF_META[t].label}
                          </div>

                          <div className="text-xs text-slate-300 mt-1 line-clamp-2 max-w-[150px]">
                            {ROOF_META[t].description}
                          </div>

                          <div className="text-xs mt-2 text-slate-400">
                            Runoff coeff:{" "}
                            <span className="font-medium text-white">
                              {ROOF_META[t].coeff}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* dwellers & space */}
          <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-700 shadow-lg hover:shadow-xl rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-teal-300">
                Number of Dwellers*
              </label>

              <div className="mt-2 flex items-center gap-4">
                {/* Slider */}
                <input
                  type="range"
                  name="dwellers"
                  min="1"
                  max="20"
                  value={Number(rooftopFormData.rooftop.dwellers || 1)}
                  onChange={handleRooftopChange}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                {/* Display value */}
                <div className="w-12 text-center bg-white/10 border border-white/20 py-1 rounded-lg text-sm font-semibold">
                  {rooftopFormData.rooftop.dwellers || 1}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-teal-300">
                Available Space (sq. ft.)*
              </label>
              <input
                name="space"
                value={rooftopFormData.rooftop.space}
                onChange={handleRooftopChange}
                type="number"
                inputMode="numeric"
                placeholder="e.g., 50"
                className="mt-2 w-full p-3 bg-transparent border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {/* Soil Type Selector (Modern UI Style) */}
            <div className="col-span-2">
              <label className="text-sm text-slate-300">
                Soil Type (Optional)
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {(Object.keys(SOIL_META) as SoilType[]).map((soil) => {
                  const selected = rooftopFormData.rooftop.soil === soil;

                  return (
                    <label
                      key={soil}
                      className={`flex flex-col items-start gap-1 p-3 rounded-lg border cursor-pointer transition ${
                        selected
                          ? "bg-emerald-600/30 border-emerald-400 shadow-md"
                          : "bg-white/2 border-white/5 hover:bg-white/3"
                      }`}
                    >
                      {/* Hidden radio to make it fully controlled */}
                      <div className="flex gap-0">
                        <input
                          type="radio"
                          name="soil"
                          value={soil}
                          checked={selected}
                          onChange={handleRooftopChange}
                          className="hidden"
                        />

                        <div>
                          <div className="inline-flex gap-3">
                            <img
                              src={SOIL_META[soil].img}
                              alt={soil}
                              className="w-14 h-14 object-cover rounded-md border border-white/10"
                            />

                            <div>
                              <div className="text-sm font-semibold text-white">
                                {SOIL_META[soil].label}
                              </div>
                              <div className="text-[11px] text-slate-300 leading-tight w-22">
                                {SOIL_META[soil].type}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="text-[11px] text-slate-300 mt-1 leading-tight">
                          {SOIL_META[soil].desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 border border-teal-300 text-teal-100 hover:text-white hover:bg-teal-600 font-semibold py-3 rounded-lg shadow-lg hover:opacity-95 transition cursor-pointer"
            >
              {saving ? "Saving..." : "Submit All Details"}
            </button>

            <button
              type="button"
              onClick={() => {
                setForm({
                  area: "",
                  type: "",
                  dwellers: "",
                  space: "",
                  soil: "",
                  perPerson: 135,
                  days: 3,
                  priority: "Full Household",
                  runoffCoefficient: undefined,
                  sampleRainfallMM: 50,
                });
              }}
              className="px-4 py-3 rounded-lg border border-white/10 text-sm hover:bg-teal-600 transition cursor-pointer"
            >
              Reset
            </button>
          </div>

          {rooftopSubmitted && (
            <div className="mt-3 p-3 bg-green-500/20 text-green-200 rounded-lg animate-pulse">
              ✅ Rooftop details submitted successfully!
            </div>
          )}
        </div>

        {/* right: live preview & recommendations */}
        <div className="space-y-4 mr-5">
          <div className="bg-white/3 p-4 rounded-2xl border border-white/6">
            <div className="flex items-start justify-between gap-4">
              <div className="bg-white/3 p-4 rounded-2xl border border-white/6">
                <div className="flex items-start justify-between gap-4 w-127">
                  <div>
                    <div className="text-xs text-slate-300">Selected Roof</div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="bg-white/5 p-3 rounded-xl w-14 h-14 flex items-center justify-center overflow-hidden">
                        {selectedMeta ? (
                          <img
                            src={selectedMeta.img}
                            alt={selectedMeta.label}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-white/10" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-semibold">
                          {rooftopFormData.rooftop.type || "Not selected"}
                        </div>

                        <div className="text-xs text-slate-300 mt-1 max-w-xs">
                          {selectedMeta
                            ? selectedMeta.description
                            : "Pick a roof type to auto-fill runoff coefficient & tips."}
                        </div>

                        <div className="text-xs text-slate-400 mt-2">
                          Runoff coeff:{" "}
                          <span className="font-medium text-white">
                            {selectedMeta?.coeff ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-300">
                      Available Space
                    </div>
                    <div className="text-lg font-semibold">
                      {rooftopFormData.rooftop.space || "---"} sq.ft
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/3 p-4 rounded-2xl border border-white/6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-300">
                  Estimated capture (sample)
                </div>
                <div className="text-2xl font-bold">
                  {harvestEstimate.toLocaleString()} L
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  for {sampleRain} mm rainfall
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-300">
              <strong>Tip:</strong> To reduce overflow and siltation, add a{" "}
              <span className="font-medium text-white">
                first-flush diverter
              </span>{" "}
              and a{" "}
              <span className="font-medium text-white">sand/gravel filter</span>
              .
            </div>
          </div>

          <div className="bg-gradient-to-tr from-emerald-700/10 to-cyan-700/6 p-4 rounded-2xl border border-white/6">
            <div className="text-sm text-slate-200 font-semibold mb-2">
              Quick Recommendations
            </div>

            <ul className="text-sm text-slate-300 space-y-2">
              <li>
                • If runoff coefficient is low (≤0.65), prefer pre-filter &
                larger recharge area.
              </li>
              <li>
                • If available space is limited, consider deeper recharge pits
                rather than wide footprint.
              </li>
              <li>
                • If tank will be left idle for months, plan a small outlet to
                prevent stagnation and maintain quality.
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
