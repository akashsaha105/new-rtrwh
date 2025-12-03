// WaterNewsImpact.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Droplet, Clock, TrendingUp, ArrowRightCircle } from "lucide-react";

/**
 * Requirements:
 * - Tailwind CSS
 * - lucide-react, framer-motion (optional)
 * npm i lucide-react framer-motion
 *
 * Notes:
 * - This component uses a simple deterministic model to illustrate impact.
 * - Replace the `FACTS_API` and `NEWS_API` with real endpoints if you want live data.
 */

const FACTS_API = "/api/water-facts-demo"; // replace with production endpoint
const NEWS_API = "/api/water-news-demo"; // replace with production endpoint

// Simple helper to format large numbers
function fmt(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

/**
 * Projection model (simplified):
 * - city has current annual supply S_current (million liters/year) and demand D_current.
 * - baseline demand grows at g% per year (user-settable).
 * - donations are modeled as additional supply delivered when scheduled.
 * - We compute deficit = demand - (supply + cumulative_donations).
 *
 * This is illustrative and intentionally simple. Real water modelling needs specialists.
 */
function simulateProjection({
  years = 10,
  S_current,
  D_current,
  growthRate,
  donationsSchedule /* array of {yearOffset (0..years), liters} */,
}) {
  // convert all volumes to million liters (ML) for easier numbers
  const toML = (liters) => liters / 1_000_000;
  const supplyML = S_current; // already in ML/year
  let demandML = D_current;
  let cumulativeDonationML = 0;
  const timeline = [];

  for (let y = 0; y <= years; y++) {
    // apply donations scheduled for this year
    const donatedThisYear = donationsSchedule
      .filter((d) => d.yearOffset === y)
      .reduce((s, d) => s + toML(d.liters), 0);
    cumulativeDonationML += donatedThisYear;

    // compute current demand (growth applies at start of each next year)
    const deficitML = Math.max(0, demandML - (supplyML + cumulativeDonationML));

    timeline.push({
      yearOffset: y,
      supplyML,
      demandML,
      cumulativeDonationML,
      deficitML,
    });

    // grow demand for next iteration
    demandML = demandML * (1 + growthRate / 100);
  }

  return timeline;
}

export default function Donate() {
  // UI state
  const [facts, setFacts] = useState([
    // fallback facts when API isn't available — update these from your backend
    {
      id: "niti-2018",
      title: "NITI Aayog (baseline)",
      summary:
        "NITI Aayog's Composite Water Management Index and follow-ups warn India faces severe water stress; nearly 600 million people were already in high-to-extreme water stress in earlier assessments.",
      source: "NITI Aayog / CWMI",
      href: "#",
    },
  ]);
  const [news, setNews] = useState([]);
  const [selectedCity, setSelectedCity] = useState({
    id: "sample-city",
    name: "Bengaluru (example)",
    // S_current: modeled available annual supply in million liters (ML/year).
    // These numbers are illustrative — replace with actual city water budgets.
    S_current: 250_000 / 1_000, // 250,000 ML/year -> represent as thousands? For clarity, keep ML units
    D_current: 400_000 / 1_000, // 400,000 ML/year
  });

  // donation input
  const [donateLiters, setDonateLiters] = useState(100_000); // 100k liters default
  const [donateYearOffset, setDonateYearOffset] = useState(0); // 0 = this year
  const [yearsToProject, setYearsToProject] = useState(10);
  const [growthRate, setGrowthRate] = useState(3.5); // % annual demand growth

  const [donations, setDonations] = useState(() => {
    // persisted demo donations
    try {
      const raw = localStorage.getItem("demo_donations_v2");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // fetch facts & news (demo stub; replace with real endpoints)
  useEffect(() => {
    // for demo I keep fallback facts. In prod, call your backend endpoints and setFacts/setNews
    // fetch(FACTS_API).then(r=>r.json()).then(setFacts).catch(()=>{/*keep fallback*/})
    // fetch(NEWS_API).then(r=>r.json()).then(setNews).catch(()=>{/*no-op*/})
  }, []);

  useEffect(() => {
    localStorage.setItem("demo_donations_v2", JSON.stringify(donations));
  }, [donations]);

  const timeline = useMemo(() => {
    const schedule = donations.map((d) => ({
      yearOffset: d.yearOffset,
      liters: d.liters,
    }));
    return simulateProjection({
      years: yearsToProject,
      S_current: selectedCity.S_current, // ML/year
      D_current: selectedCity.D_current,
      growthRate,
      donationsSchedule: schedule,
    });
  }, [donations, yearsToProject, growthRate, selectedCity]);

  function handleDonateNow() {
    if (!donateLiters || donateLiters <= 0) return alert("Enter donation liters > 0");
    const record = {
      id: Date.now(),
      cityId: selectedCity.id,
      cityName: selectedCity.name,
      liters: donateLiters,
      yearOffset: Number(donateYearOffset),
      date: new Date().toISOString(),
    };
    setDonations((d) => [record, ...d]);
  }

  function clearDemo() {
    if (!confirm("Clear demo donations and reset simulation?")) return;
    setDonations([]);
    localStorage.removeItem("demo_donations_v2");
  }

  // quick summary values
  const baselineDeficitNow = timeline.length ? timeline[0].deficitML : 0;
  const deficitInYearsNoDonation = simulateProjection({
    years: yearsToProject,
    S_current: selectedCity.S_current,
    D_current: selectedCity.D_current,
    growthRate,
    donationsSchedule: [],
  })[yearsToProject].deficitML;
  const deficitInYearsWithDonation = timeline[yearsToProject].deficitML;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Facts & News */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Droplet size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Water facts & news (India — 2025)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Concise, cited facts and recent headlines relevant to water scarcity.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {facts.map((f) => (
              <div key={f.id} className="p-3 border rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{f.title}</div>
                    <div className="text-sm text-slate-500">{f.summary}</div>
                  </div>
                  <a href={f.href} className="text-xs text-blue-600 ml-3">
                    source
                  </a>
                </div>
              </div>
            ))}

            <div>
              <h4 className="text-sm font-semibold">Recent headlines</h4>
              <div className="mt-2 space-y-2">
                {news.length === 0 && (
                  <div className="text-xs text-slate-400">No live feed configured — add a news API.</div>
                )}
                {news.map((n) => (
                  <a
                    key={n.id}
                    href={n.href}
                    className="block text-sm p-2 hover:bg-slate-50 rounded-md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-slate-400">{n.source} • {n.date}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Data & predictions are simplifications. For operational decisions, use official hydrology and city water
            budgets.
          </div>
        </motion.div>

        {/* Center: Simulation & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Donate & Project Impact</h2>
                <p className="text-sm text-slate-500">Simulate how water donations change a city's deficit over time.</p>
              </div>

              <div className="text-right text-sm">
                <div className="text-xs text-slate-400">Selected city</div>
                <div className="font-semibold">{selectedCity.name}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border rounded-xl">
                <label className="text-xs text-slate-500">Donation (liters)</label>
                <input
                  type="number"
                  className="w-full mt-2 p-2 rounded-md border"
                  value={donateLiters}
                  onChange={(e) => setDonateLiters(Number(e.target.value))}
                />
                <div className="text-xs text-slate-400 mt-1">Example: 100000 = 100k L</div>
              </div>

              <div className="p-3 border rounded-xl">
                <label className="text-xs text-slate-500">Deliver in (years from now)</label>
                <input
                  type="number"
                  min={0}
                  max={yearsToProject}
                  className="w-full mt-2 p-2 rounded-md border"
                  value={donateYearOffset}
                  onChange={(e) => setDonateYearOffset(Number(e.target.value))}
                />
              </div>

              <div className="p-3 border rounded-xl">
                <label className="text-xs text-slate-500">Annual demand growth (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full mt-2 p-2 rounded-md border"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Number(e.target.value))}
                />
                <div className="text-xs text-slate-400 mt-1">Real-world growth varies; use local data where possible.</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleDonateNow}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white inline-flex items-center gap-2"
              >
                <ArrowRightCircle size={16} /> Donate (simulate)
              </button>

              <button
                onClick={() => {
                  // quick add: donate 500k L this year
                  setDonateLiters(500000);
                  setDonateYearOffset(0);
                }}
                className="px-3 py-2 rounded-lg border text-sm"
              >
                Quick 500kL
              </button>

              <button onClick={clearDemo} className="px-3 py-2 rounded-lg border text-sm text-rose-600">
                Clear demo
              </button>
            </div>

            {/* Snapshot */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border">
                <div className="text-xs text-slate-400">Current deficit (approx)</div>
                <div className="font-semibold text-xl">{fmt(Math.round(baselineDeficitNow * 1000000))} L</div>
                <div className="text-xs text-slate-400">(demand − supply − donations)</div>
              </div>

              <div className="p-3 rounded-xl border">
                <div className="text-xs text-slate-400">Projected deficit in {yearsToProject} yrs — no donations</div>
                <div className="font-semibold text-xl">{fmt(Math.round(deficitInYearsNoDonation * 1000000))} L</div>
              </div>

              <div className="p-3 rounded-xl border">
                <div className="text-xs text-slate-400">Projected deficit in {yearsToProject} yrs — with donations</div>
                <div className="font-semibold text-xl">{fmt(Math.round(deficitInYearsWithDonation * 1000000))} L</div>
              </div>
            </div>
          </motion.div>

          {/* Timeline (textual) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow">
            <h3 className="font-semibold">Projection timeline (years)</h3>
            <div className="mt-3 space-y-2 text-sm">
              {timeline.map((t) => (
                <div key={t.yearOffset} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <div className="font-medium">Year +{t.yearOffset}</div>
                    <div className="text-xs text-slate-400">
                      Demand: {fmt(Math.round(t.demandML * 1_000_000))} L • Supply: {fmt(Math.round(t.supplyML * 1_000_000))} L
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmt(Math.round(t.deficitML * 1_000_000))} L deficit</div>
                    <div className="text-xs text-slate-400">
                      Donated so far: {fmt(Math.round(t.cumulativeDonationML * 1_000_000))} L
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donation history */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow">
            <h3 className="font-semibold">Donations (demo)</h3>
            <div className="mt-3 divide-y">
              {donations.length === 0 && <div className="text-xs text-slate-400 p-3">No donations yet (demo).</div>}
              {donations.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{fmt(d.liters)} L</div>
                    <div className="text-xs text-slate-400">
                      To: {d.cityName} • Deliver in year +{d.yearOffset} • {new Date(d.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">demo</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-xs text-slate-500">
            Honest note: Small point donations help emergency needs and show civic engagement, but they do not
            replace systemic water management (groundwater recharge, supply augmentation, distribution fixing,
            wastewater reuse). The simulation is a simplified illustration, not a substitute for professional water
            planning.
          </div>
        </div>
      </div>
    </div>
  );
}
