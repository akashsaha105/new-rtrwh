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

      // 1. Fetch latest user profile data (rooftop, location, etc.)
      const userDocRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        alert("User profile not found. Please update your profile first.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const rooftop = userData.rooftop || {};
      const userLoc = userData.location || {};
      const geopoint = userData.geopoint || [0, 0];

      // 2. Map to AssessmentInput
      // Note: User inputs are in sq. ft., we need m2.
      // 1 sq ft = 0.092903 m2
      const SQFT_TO_M2 = 0.092903;

      const roofAreaSqFt = parseFloat(rooftop.area || "0");
      const openSpaceSqFt = parseFloat(rooftop.space || "0");

      const assessmentInput = {
        id: uid, // use uid as assessment id for simplicity in this flow
        name: userData.fullName || "User Assessment",
        location: {
          lat: geopoint[0],
          lng: geopoint[1],
          address: userLoc.address,
        },
        dwellers: parseInt(rooftop.dwellers || "0", 10),
        roofArea_m2: roofAreaSqFt * SQFT_TO_M2,
        openSpace_m2: openSpaceSqFt * SQFT_TO_M2,
        roofMaterial: rooftop.type,
        // map other fields if needed
      };

      // 3. Compute Feasibility
      const result = await computeFeasibility(assessmentInput);

      const reportObj = {
        assessmentId: uid,
        ...result,
      };

      // 4. Save Report
      // We use the user UID as the document ID for the report to keep it 1:1
      const reportRef = doc(firestore, "reports", uid);
      await setDoc(reportRef, reportObj);

      // 5. Update/Create Assessment Record (to keep history or status)
      // We can upsert an assessment doc with the same ID
      const assessmentRef = doc(firestore, "assessments", uid);
      await setDoc(
        assessmentRef,
        {
          userId: uid,
          status: "done",
          reportRef: `reports/${uid}`,
          updatedAt: new Date().toISOString(),
          // save snapshot of input used
          inputSnapshot: assessmentInput,
        },
        { merge: true }
      );

      console.log("Report successfully generated for user:", uid);
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
          {/* Main Verdict Section - Simplified for General Users */}
          <div className="flex flex-col gap-6 items-start justify-between mb-8">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
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
                  Feasibility Verdict
                </span>
              </div>

              {/* Huge Friendly Title */}
              <h2 className="text-3xl md:text-5xl font-bold text-slate-100 mb-6 leading-tight">
                {props.assessmentStatus === "processing"
                  ? "Analyzing your area..."
                  : props.assessmentStatus === "error"
                    ? "Analysis Failed"
                    : props.assessmentStatus === "none"
                      ? "Is your area ready for rain?"
                      : report?.category === "High"
                        ? "Excellent Potential! 🌟"
                        : report?.category === "Moderate"
                          ? "Good Potential "
                          : "Challenging Location ⚠️"}
              </h2>


              {/* Simple plain-english explanation */}
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-3xl mb-6">
                {props.assessmentStatus === "none" ? (
                  "We need to check your roof size and rainfall patterns. Click the button below to find out if rainwater harvesting will work for you."
                ) : report ? (
                  report.category === "High" ? (
                    "Your location captures plenty of rain, and your roof size is perfect for harvesting. You can save a significant amount of water."
                  ) : report.category === "Moderate" ? (
                    "Your location is decent for harvesting. While you might not cover all your needs, you can still save water for specific uses like gardening or cleaning."
                  ) : (
                    "Rainfall or roof space is limited in your area. Harvesting is possible but might only provide a small supplement to your water needs."
                  )
                ) : (
                  "..."
                )}
              </p>

              {/* Error Messages */}
              {props.errorMessage && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {props.errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={generate}
              disabled={loading || props.assessmentStatus === "processing"}
              className={`
                flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold
                bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-900/20
                transition-all duration-200
                hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-900/40 hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
              `}
            >
              {loading || props.assessmentStatus === "processing" ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {report ? "Re-Analyze Area" : "Check My Feasibility"}
                </>
              )}
            </button>

            {report && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-6 py-4 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 text-base font-medium hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
              >
                {showDetails ? "Hide Technical Details" : "Show Technical Details"}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Technical Details Section (Collapsible) */}
          {showDetails && report && (
            <div className="mt-10 pt-10 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Visual Gauge */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-3xl border border-white/5">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
                    Technical Score
                  </h4>
                  <div className="relative h-40 w-40 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle className="text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-slate-100">{report.feasibilityScore}</span>
                      <span className="text-xs text-slate-400 uppercase font-medium">/ 100</span>
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-400 mt-4 max-w-xs">
                    This score combines rainfall data, roof area, and soil properties into a single metric.
                  </p>
                </div>

                {/* Score Breakdown */}
                {report.breakdown && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Why did I get this score?
                    </h4>

                    {/* Roof Potential */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-200 font-medium">Roof Area</span>
                        <span className={`text-sm font-bold ${getScoreColor(report.breakdown.roofScore)}`}>
                          {report.breakdown.roofScore / 20}/5
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(report.breakdown.roofScore)} rounded-full`} style={{ width: `${report.breakdown.roofScore}%` }} />
                      </div>
                    </div>

                    {/* Rainfall */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-200 font-medium">Rainfall</span>
                        <span className={`text-sm font-bold ${getScoreColor(report.breakdown.rainfallScore)}`}>
                          {report.avgRainfall_mm?.toLocaleString()} mm/yr
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(report.breakdown.rainfallScore)} rounded-full`} style={{ width: `${report.breakdown.rainfallScore}%` }} />
                      </div>
                    </div>

                    {/* Soil */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-200 font-medium">Soil Quality</span>
                        <span className={`text-sm font-bold ${getScoreColor(report.breakdown.soilScore)}`}>
                          {report.breakdown.soilScore >= 60 ? "Good" : "Average"}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(report.breakdown.soilScore)} rounded-full`} style={{ width: `${report.breakdown.soilScore}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-800/40 rounded-xl p-4 mt-4 border border-slate-700/50">
                      <p className="text-sm text-slate-300 italic">
                        "{report.explanation}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
