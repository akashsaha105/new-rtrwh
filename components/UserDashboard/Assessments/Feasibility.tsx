import { auth, firestore } from "@/firebase";
import { computeFeasibility } from "@/lib/computeFeasibility";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, getDoc } from "firebase/firestore";

interface assessmentData {
  id?: string;
  name: string;
  location: { lat: number; lng: number };
  dwellers: number;
  roofArea_m2: number;
  openSpace_m2: number;
  roofMaterial: string;
  roofSlope: string;
}

interface Props {
  assessmentStatus: string;
  feasibility: {
    feasible: boolean;
    reason: string;
  };
  errorMessage: string | null;
  report:
  | {
    assessmentId?: string;
    avgRainfall_mm?: number;
    litres_per_year?: number;
    category: "High" | "Moderate" | "Low";
    feasibilityScore: number;
    breakdown: {
      roofScore: number;
      openSpaceScore: number;
      rainfallScore: number;
      gwScore: number;
      soilScore: number;
    };
    explanation?: string;
    recommendedStructures?: { type: string; confidence: number; reason: string }[];
    environmentalImpact?: {
      descriptionBullets: string[];
    };
  }
  | undefined;
}

interface apiResult {
  design: {
    feasible: string;
    reason: string;
  };
}

export default function Feasibility(props: Props) {
  const [apiResult, setApiResult] = useState<apiResult>();
  const [loading, setLoading] = useState(false);
  const [liveReport, setLiveReport] = useState<Props["report"] | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Optional: auto-fetch latest report for current user in case parent didn't pass it
  React.useEffect(() => {
    if (props.report) {
      setLiveReport(props.report);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      try {
        // find assessment by userId
        const assessmentsQuery = query(
          collection(firestore, "assessments"),
          where("userId", "==", currentUser.uid)
        );
        const existingAssessments = await getDocs(assessmentsQuery);
        if (existingAssessments.empty) return;

        const assessmentDoc = existingAssessments.docs[0];
        const assessmentId = assessmentDoc.id;

        const reportRef = doc(firestore, "reports", assessmentId);
        const unsubReport = onSnapshot(reportRef, (snap) => {
          if (snap.exists()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = snap.data() as any;
            setLiveReport({
              assessmentId: data.assessmentId ?? assessmentId,
              avgRainfall_mm: data.avgRainfall_mm,
              litres_per_year: data.litres_per_year,
              category: data.category,
              feasibilityScore: data.feasibilityScore,
              breakdown: data.breakdown,
              explanation: data.explanation,
            });
          }
        });

        return () => unsubReport();
      } catch (e) {
        console.error("Error loading feasibility report:", e);
      }
    });

    return () => unsubAuth();
  }, [props.report]);

  const report = liveReport || props.report;

  async function generate() {
    setLoading(true);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert("User not logged in");
        setLoading(false);
        return;
      }

      const uid = currentUser.uid;

      // Query assessments belonging to this user
      const assessmentsQuery = query(
        collection(firestore, "assessments"),
        where("userId", "==", uid)
      );

      const existingAssessments = await getDocs(assessmentsQuery);

      if (existingAssessments.empty) {
        alert("No assessment found for the current user.");
        setLoading(false);
        return;
      }

      // Pick the first assessment
      const assessmentDoc = existingAssessments.docs[0];
      const assessmentData = {
        id: assessmentDoc.id,
        ...assessmentDoc.data(),
      } as assessmentData;

      // 1. Calculate base stats locally (for scores/breakdowns that the API might not fully give yet)
      const baseReport = await computeFeasibility(assessmentData);

      // 2. Fetch from Local Python API
      let apiResult = null;
      const unsub = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) return;
        try {
          const userDoc = doc(firestore, "users", currentUser.uid);
          const userSnap = await getDoc(userDoc);
          // console.log("User ID: ", currentUser.uid);
          if (!userSnap.exists()) return;
          const userData = userSnap.data();
          const queryParams = new URLSearchParams({
            rooftop_area_m2: String(userData.rooftop.area || 100),
            rooftop_type: userData.rooftop.type || "concrete",
            lat: String(userData.geopoint[0] || 12.97),
            lon: String(userData.geopoint[1] || 77.59)
          });
          const res = await fetch(`http://0.0.0.0:8001/rwh-design?${queryParams}`);
          if (res.ok) {
            apiResult = await res.json();
            console.log("API Result: ", apiResult);
            setApiResult(apiResult);
          } else {
            console.warn("Local API returned error:", res.status);
          }
        } catch (e) {
          console.error("Error fetching from local API:", e);
        }
      })
      // try {
      //   const queryParams = new URLSearchParams({
      //     rooftop_area_m2: String(assessmentData.roofArea_m2 || 100),
      //     rooftop_type: assessmentData.roofMaterial || "concrete",
      //     lat: String(assessmentData.location?.lat || 12.97),
      //     lon: String(assessmentData.location?.lng || 77.59),
      //     year: "2024",
      //   });

      //   const res = await fetch(`http://127.0.0.1:8000/rwh-design?${queryParams}`);
      //   if (res.ok) {
      //     apiResult = await res.json();
      //   } else {
      //     console.warn("Local API returned error:", res.status);
      //   }
      // } catch (err) {
      //   console.warn("Failed to fetch from local API:", err);
      // }

      // 3. Merge API data if available
      let finalCategory = baseReport.category;
      // let finalExplanation = baseReport.explanation;
      const finalBreakdown = baseReport.breakdown;
      let finalScore = baseReport.feasibilityScore;

      if (apiResult) {
        // Map API "feasible" (yes/no) to our categories
        const isFeasible = apiResult.design?.feasible === "yes";
        finalCategory = isFeasible ? "High" : "Low";

        // If feasible, ensure score is at least decent; if not, cap it?
        // For now, let's trust the API verdict heavily.
        if (isFeasible && finalScore < 60) finalScore = 85;
        if (!isFeasible && finalScore > 40) finalScore = 35;

        // Use API's design category as the explanation
        // finalExplanation = apiResult.design?.category || finalExplanation;
      }

      // Compute the feasibility report object
      const reportObj = {
        assessmentId: assessmentDoc.id,
        ...baseReport,
        category: finalCategory,
        // explanation: finalExplanation,
        feasibilityScore: finalScore,
        breakdown: finalBreakdown,
        // Store API raw data for debug or extra details if needed
        apiData: apiResult ? apiResult : undefined
      };

      // WRITE report into document named with *assessmentId* (to match useEffect)
      const reportRef = doc(firestore, "reports", currentUser.uid);
      // await setDoc(reportRef, reportObj);

      // UPDATE assessment status
      const assessmentRef = doc(firestore, "assessments", assessmentDoc.id);
      await updateDoc(assessmentRef, {
        status: "done",
        // keep a reference if you need it
        reportRef: `reports/${assessmentDoc.id}`,
      });

      console.log(
        "Report successfully generated for assessment:",
        assessmentDoc.id
      );
    } catch (e) {
      console.error("Generation Error:", e);
      alert("Failed to generate report. Check console.");
    } finally {
      setLoading(false);
    }
  }

  // Helper for color coding scores
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="mb-10">
      <h3 className="text-lg font-medium mb-4 tracking-wide text-slate-300/80 uppercase">
        Feasibility Report
      </h3>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_#22d3ee10,_transparent_60%),radial-gradient(circle_at_bottom_left,_#4ade8010,_transparent_60%)]" />

        <div className="relative p-6 md:p-8">
          {/* Header Section: Verdict & Score */}
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]
                    ${props.assessmentStatus === "processing"
                      ? "bg-amber-400 text-amber-400"
                      : props.assessmentStatus === "error"
                        ? "bg-rose-500 text-rose-500"
                        : props.assessmentStatus === "none"
                          ? "bg-sky-400 text-sky-400"
                          : report?.category === "High"
                            ? "bg-emerald-400 text-emerald-400"
                            : report?.category === "Moderate"
                              ? "bg-amber-400 text-amber-400"
                              : "bg-rose-400 text-rose-400"
                    }`}
                />
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Assessment Status
                </span>
              </div>

              {/* <h2 className="text-3xl md:text-5xl font-bold text-slate-100 mb-6 leading-tight">
                {props.assessmentStatus === "processing"
                  ? "Analyzing your area..."
                  : props.assessmentStatus === "error"
                    ? "Analysis Failed"
                    : props.assessmentStatus === "none"
                      ? "Is your area ready for rain?"
                      : report?.category === "High"
                        ? "Excellent Potential! 🌟"
                        : report?.category === "Moderate"
                          ? "Good Potential"
                          : "Challenging Location ⚠️"}
              </h2> */}

              <h2 className="text-3xl md:text-5xl font-bold text-slate-100 mb-6 leading-tight">
                {
                  (apiResult?.design?.feasible === "yes" || (!apiResult && report?.category === "High"))
                    ? "It is Feasible 🌟"
                    : (apiResult?.design?.feasible === "no" || (!apiResult && report?.category === "Moderate"))
                      ? "Not Feasible"
                      : (apiResult || report)
                        ? "Challenging Location ⚠️"
                        : "Is your area ready for rain?"
                }
              </h2>

              {/* <p className="text-slate-300 text-xl leading-relaxed max-w-2xl">
                {report
                  ? report.category === "High"
                    ? "Great news! Your roof area and local rainfall are perfect for harvesting plenty of water."
                    : report.category === "Moderate"
                      ? "You can harvest a decent amount of water, though some improvements might help."
                      : "It might be difficult to harvest large amounts here, but every drop counts."
                  : props.assessmentStatus === "none"
                    ? "We can check if your home is suitable for saving rainwater. Usage is simple and free."
                    : ""}
              </p> */}

              <p className="text-slate-300 text-xl leading-relaxed max-w-2xl">
                {apiResult?.design.category}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={generate}
                  disabled={loading || props.assessmentStatus === "processing"}
                  className={`
                  inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold
                  bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-900/20
                  transition-all duration-200
                  hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-900/40 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer
                `}
                >
                  {loading || props.assessmentStatus === "processing" ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Checking...
                    </>
                  ) : (
                    "Check My Result"
                  )}
                </button>

                {report && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    {showDetails ? "Hide Technical Details" : "Show Technical Details"}
                  </button>
                )}
              </div>

              {/* Error Messages */}
              {props.errorMessage && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {props.errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Technical Details Section */}
          {showDetails && report && (
            <div className="mt-10 pt-10 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-10">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-200 mb-2">
                    Technical Breakdown
                  </h3>
                  <p className="text-slate-400">
                    A closer look at the data driving your result.
                  </p>
                </div>
                {/* Circular Score Gauge */}
                <div className="relative flex-shrink-0">
                  <div className="relative h-32 w-32 md:h-40 md:w-40 flex items-center justify-center">
                    {/* SVG Gauge */}
                    <svg
                      className="h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {/* Background Circle */}
                      <circle
                        className="text-slate-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="42"
                        cx="50"
                        cy="50"
                      />
                      {/* Progress Circle */}
                      <circle
                        className={`${getScoreColor(
                          report.feasibilityScore
                        )} transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={
                          264 - (264 * report.feasibilityScore) / 100
                        }
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="42"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl md:text-4xl font-bold text-slate-100">
                        {report.feasibilityScore}
                      </span>
                      <span className="text-xs text-slate-400 uppercase font-medium">
                        / 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {report?.breakdown && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Key Metrics */}
                  <div className="space-y-8">
                    {/* Roof Size */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-200 font-medium text-lg">
                          Roof Size
                        </span>
                        <span
                          className={`text-base font-bold ${getScoreColor(
                            report.breakdown.roofScore
                          )}`}
                        >
                          {report.breakdown.roofScore >= 70
                            ? "Excellent"
                            : report.breakdown.roofScore >= 40
                              ? "Average"
                              : "Small"}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(
                            report.breakdown.roofScore
                          )} rounded-full`}
                          style={{ width: `${report.breakdown.roofScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        Is your roof large enough to catch significantly usable
                        water?
                      </p>
                    </div>

                    {/* Rainfall */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-200 font-medium text-lg">
                          Rainfall
                        </span>
                        <span
                          className={`text-base font-bold ${getScoreColor(
                            report.breakdown.rainfallScore
                          )}`}
                        >
                          {report.avgRainfall_mm?.toLocaleString()} mm/yr
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(
                            report.breakdown.rainfallScore
                          )} rounded-full`}
                          style={{ width: `${report.breakdown.rainfallScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        How much rain does your location typically get in a
                        year?
                      </p>
                    </div>

                    {/* Soil Quality */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-200 font-medium text-lg">
                          Soil Quality
                        </span>
                        <span
                          className={`text-base font-bold ${getScoreColor(
                            report.breakdown.soilScore
                          )}`}
                        >
                          {report.breakdown.soilScore >= 60
                            ? "Absorbs Well"
                            : report.breakdown.soilScore >= 30
                              ? "Moderate"
                              : "Rocky/Hard"}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(
                            report.breakdown.soilScore
                          )} rounded-full`}
                          style={{ width: `${report.breakdown.soilScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        Can the ground easily soak up water for recharging?
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Actionable Insights */}
                  <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/30">
                    <h4 className="text-base font-semibold text-slate-300 uppercase tracking-wider mb-6">
                      What This Means For You
                    </h4>

                    <ul className="space-y-6">
                      <li className="flex gap-4">
                        <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium text-lg">
                            Potential Harvest
                          </p>
                          <p className="text-slate-400 mt-1">
                            You could save about{" "}
                            <span className="text-sky-300 font-bold">
                              {report?.litres_per_year?.toLocaleString()} liters
                            </span>{" "}
                            of water every year. That&apos;s a lot!
                          </p>
                        </div>
                      </li>

                      <li className="flex gap-4">
                        <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium text-lg">
                            Our Recommendation
                          </p>
                          <p className="text-slate-400 mt-1">
                            {report?.recommendedStructures?.[0]?.type
                              ? `We suggest building a ${report.recommendedStructures[0].type}. It suits your land best.`
                              : "Generate a report to see recommendations."}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
