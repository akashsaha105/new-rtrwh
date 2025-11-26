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

export default function Feasibility(props: Props) {
  const [loading, setLoading] = useState(false);
  const [liveReport, setLiveReport] = useState<Props["report"] | null>(null);

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

      // Compute the feasibility report
      const reportObj = {
        // ensure assessmentId is stored in the report
        assessmentId: assessmentDoc.id,
        ...(await computeFeasibility(assessmentData)),
      };

      // WRITE report into document named with *assessmentId* (to match useEffect)
      const reportRef = doc(firestore, "reports", assessmentDoc.id);
      await setDoc(reportRef, reportObj);

      // UPDATE assessment status
      const assessmentRef = doc(firestore, "assessments", assessmentDoc.id);
      await updateDoc(assessmentRef, {
        status: "done",
        // keep a reference if you need it
        reportRef: `reports/${assessmentDoc.id}`,
      });

      console.log("Report successfully generated for assessment:", assessmentDoc.id);
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

              <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">
                {props.assessmentStatus === "processing"
                  ? "Analyzing Location..."
                  : props.assessmentStatus === "error"
                    ? "Analysis Failed"
                    : props.assessmentStatus === "none"
                      ? "Ready to Analyze"
                      : report?.category === "High"
                        ? "Highly Feasible"
                        : report?.category === "Moderate"
                          ? "Moderately Feasible"
                          : "Challenging Location"}
              </h2>

              <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                {report?.explanation ??
                  props.feasibility.reason ??
                  (props.assessmentStatus === "none"
                    ? "We need to analyze your location's rainfall, soil, and space to determine feasibility."
                    : "")}
              </p>

              {/* Error Messages */}
              {props.errorMessage && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {props.errorMessage}
                </div>
              )}
            </div>

            {/* Circular Score Gauge (Only show if report exists) */}
            {report && (
              <div className="relative flex-shrink-0">
                <div className="relative h-32 w-32 md:h-40 md:w-40 flex items-center justify-center">
                  {/* SVG Gauge */}
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
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
                      className={`${getScoreColor(report.feasibilityScore)} transition-all duration-1000 ease-out`}
                      strokeWidth="8"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * report.feasibilityScore) / 100}
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
            )}
          </div>

          {/* Detailed Breakdown Section */}
          {report?.breakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-800/60 pt-8">
              {/* Left Column: Key Metrics */}
              <div className="space-y-6">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Key Factors
                </h4>

                {/* Roof Potential */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-200 font-medium">Roof Potential</span>
                    <span className={`text-sm font-bold ${getScoreColor(report.breakdown.roofScore)}`}>
                      {report.breakdown.roofScore >= 70 ? "Excellent" : report.breakdown.roofScore >= 40 ? "Average" : "Limited"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(report.breakdown.roofScore)} rounded-full`}
                      style={{ width: `${report.breakdown.roofScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Based on your {report.breakdown.roofScore >= 70 ? "large" : "available"} roof area.
                  </p>
                </div>

                {/* Rainfall Availability */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-200 font-medium">Rainfall Availability</span>
                    <span className={`text-sm font-bold ${getScoreColor(report.breakdown.rainfallScore)}`}>
                      {report.avgRainfall_mm?.toLocaleString()} mm/yr
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(report.breakdown.rainfallScore)} rounded-full`}
                      style={{ width: `${report.breakdown.rainfallScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Annual rainfall in your location.
                  </p>
                </div>

                {/* Soil Absorption */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-200 font-medium">Soil Absorption</span>
                    <span className={`text-sm font-bold ${getScoreColor(report.breakdown.soilScore)}`}>
                      {report.breakdown.soilScore >= 60 ? "Good" : report.breakdown.soilScore >= 30 ? "Moderate" : "Poor"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(report.breakdown.soilScore)} rounded-full`}
                      style={{ width: `${report.breakdown.soilScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ability of soil to soak up water.
                  </p>
                </div>
              </div>

              {/* Right Column: Actionable Insights */}
              <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  What this means for you
                </h4>

                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="mt-1 h-5 w-5 flex-shrink-0 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-medium">
                        Potential Capture
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        You can harvest approximately <span className="text-sky-300 font-bold">{report?.litres_per_year?.toLocaleString()} liters</span> of water annually.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="mt-1 h-5 w-5 flex-shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-medium">
                        Recommendation
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {report?.recommendedStructures?.[0]?.type
                          ? `We recommend a ${report.recommendedStructures[0].type}.`
                          : "Generate a report to see recommendations."}
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="mt-1 h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-medium">
                        Impact
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {report?.environmentalImpact?.descriptionBullets?.[0] ?? "Reduces groundwater dependency."}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={generate}
              disabled={loading || props.assessmentStatus === "processing"}
              className={`
                flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold
                bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-900/20
                transition-all duration-200
                hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-900/40 hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
              `}
            >
              {loading || props.assessmentStatus === "processing" ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Generate New Report
                </>
              )}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
