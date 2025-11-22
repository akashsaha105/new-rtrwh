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
        category: "High" | "Moderate" | "Low";
        feasibilityScore: number;
        breakdown: {
          roofScore: number;
          openSpaceScore: number;
          rainfallScore: number;
          gwScore: number;
          soilScore: number;
        };
      }
    | undefined;
}
export default function Feasibility(props: Props) {
  const [loading, setLoading] = useState(false);

  // async function generate() {
  //   setLoading(true);
  //   const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
  //     if (!currentUser) return;
  //     try {
  //       const aRef = doc(firestore, "assessments", currentUser.uid);
  //       const aSnap = onSnapshot(aRef, async (snapshot) => {
  //         if (!snapshot.exists()) {
  //           alert("Assessment not found");
  //           setLoading(false);
  //           return;
  //         }
  //         const assessmentData = {
  //           id: currentUser.uid,
  //           ...snapshot.data(),
  //         } as unknown as assessmentData;
  //         const report = computeFeasibility(assessmentData);
  //         // write report into reports/{assessmentId}
  //         const rRef = doc(firestore, "reports", currentUser.uid);
  //         await setDoc(rRef, report);
  //         // update assessment
  //         await updateDoc(aRef, {
  //           status: "done",
  //           reportRef: `reports/${currentUser.uid}`,
  //         });
  //         alert("Report generated");
  //       });
  //       return () => aSnap();
  //     } catch (err) {
  //       console.error(err);
  //       alert("Error generating report: " + String(err));
  //     } finally {
  //       setLoading(false);
  //     }
  //   });

  //   return () => unsubscribe();
  // }

  // generate report for the current user's assessment
  // async function generate() {
  //   setLoading(true);
  //   try {
  //     const user = onAuthStateChanged(auth, async (currentUser) => {
  //       if (!currentUser) return;
  //       try {
  //         // find the user's assessment
  //         const assessmentsQuery = query(
  //           collection(firestore, "assessments"),
  //           where("userId", "==", currentUser.uid)
  //         );
  //         const existingAssessments = await getDocs(assessmentsQuery);
  //         if (existingAssessments.empty) {
  //           alert("No assessment found for the current user.");
  //           setLoading(false);
  //           return;
  //         }

  //         const assessmentDoc = existingAssessments.docs[0];
  //         const assessmentData = {
  //           id: assessmentDoc.id,
  //           ...assessmentDoc.data(),
  //         } as any;

  //         // compute report
  //         const reportObj = computeFeasibility(assessmentData);

  //         // write report into reports/{assessmentId}
  //         const rRef = doc(firestore, "reports", assessmentDoc.id);
  //         await setDoc(rRef, reportObj);

  //         // update assessment status
  //         const aRef = doc(firestore, "assessments", assessmentDoc.id);
  //         await updateDoc(aRef, {
  //           status: "done",
  //           reportRef: `reports/${assessmentDoc.id}`,
  //         });
  //       } catch (e) {
  //         console.log(e);
  //       } finally {
  //         setLoading(false)
  //       }
  //     }  });
  //   if (!user) {
  //     alert("You must be signed in to generate a report.");
  //     setLoading(false);
  //     return;
  //   }

  //   alert("Report generated");
  // } catch (err) {
  //   console.error(err);
  //   alert("Error generating report: " + String(err));
  // } finally {
  //   setLoading(false);
  // }

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
      const reportObj = computeFeasibility(assessmentData);

      // WRITE report into document named *currentUser.uid*
      const reportRef = doc(firestore, "reports", uid);
      await setDoc(reportRef, reportObj);

      // UPDATE assessment status
      const assessmentRef = doc(firestore, "assessments", assessmentDoc.id);
      await updateDoc(assessmentRef, {
        status: "done",
        reportRef: `reports/${uid}`,
      });

      console.log("Report successfully generated for:", uid);
    } catch (e) {
      console.error("Generation Error:", e);
      alert("Failed to generate report. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-10">
      <h3 className="text-lg font-medium mb-3 tracking-wide text-slate-300/80 uppercase">
        Feasibility overview
      </h3>
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm transition-all duration-300 ${
          props.assessmentStatus === "processing"
            ? "from-slate-900/90 via-slate-900/80 to-amber-900/30 border-amber-600/40"
            : props.assessmentStatus === "error"
            ? "from-slate-950 via-slate-900 to-rose-950/40 border-rose-700/50"
            : props.assessmentStatus === "none"
            ? "from-slate-950 via-slate-900 to-sky-950/40 border-sky-700/40"
            : props.feasibility.feasible
            ? "from-slate-950 via-slate-900 to-emerald-950/35 border-emerald-600/50"
            : "from-slate-950 via-slate-900 to-rose-950/40 border-rose-700/40"
        }
      `}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen bg-[radial-gradient(circle_at_top,_#22d3ee19,_transparent_55%),radial-gradient(circle_at_bottom,_#4ade8014,_transparent_55%)]" />

        <div className="relative p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`
        inline-flex h-2.5 w-2.5 rounded-full
        ${
          props.assessmentStatus === "processing"
            ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
            : props.assessmentStatus === "error"
            ? "bg-rose-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]"
            : props.assessmentStatus === "none"
            ? "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
            : props.feasibility.feasible
            ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
            : "bg-rose-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]"
        }
      `}
              />
              <span
                className={`
        text-3sm font-semibold tracking-tight
        ${
          props.assessmentStatus === "processing"
            ? "text-amber-100/90"
            : props.assessmentStatus === "error"
            ? "text-rose-100/90"
            : props.assessmentStatus === "none"
            ? "text-sky-100/90"
            : props.feasibility.feasible
            ? "text-emerald-100/90"
            : "text-rose-100/90"
        }
      `}
              >
                {props.assessmentStatus === "processing"
                  ? "Assessment in progress"
                  : props.assessmentStatus === "error"
                  ? "Assessment failed"
                  : props.assessmentStatus === "none"
                  ? "Setup required"
                  : props.feasibility.feasible
                  ? "Site is feasible"
                  : "Site not feasible"}
              </span>
            </div>

            {props.report && (
              <span
                className={`
        inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium
        ${
          props.report.category === "High"
            ? "border-emerald-500/60 bg-emerald-500/5 text-emerald-100"
            : props.report.category === "Moderate"
            ? "border-amber-400/60 bg-amber-500/5 text-amber-100"
            : "border-rose-500/60 bg-rose-500/5 text-rose-100"
        }
      `}
              >
                <span className="uppercase tracking-wide opacity-80">
                  {props.report.category}
                </span>
                <span className="text-sm text-slate-200/70">
                  {props.report.feasibilityScore}/100
                </span>
              </span>
            )}
          </div>

          <p className="text-2sm leading-relaxed text-slate-200/80">
            {props.feasibility.reason}
          </p>

          {props.assessmentStatus === "error" && props.errorMessage && (
            <div className="mt-3 rounded-lg border border-rose-700/50 bg-rose-950/40 px-3 py-2 text-xs text-rose-100/90">
              <span className="font-semibold">Details: </span>
              <span className="text-rose-100/80">{props.errorMessage}</span>
            </div>
          )}

          {props.assessmentStatus === "none" && props.errorMessage && (
            <div className="mt-3 rounded-lg border border-sky-700/50 bg-sky-950/40 px-3 py-2 text-xs text-sky-100/90">
              <span className="font-semibold">Action needed: </span>
              <span className="text-sky-100/80">{props.errorMessage}</span>
            </div>
          )}

          {props.report?.breakdown && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-2sm text-slate-300/80">
              <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-2.5 py-1.5">
                <span className="text-slate-400/90">Roof</span>
                <span className="font-semibold text-slate-100">
                  {props.report.breakdown.roofScore}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-2.5 py-1.5">
                <span className="text-slate-400/90">Space</span>
                <span className="font-semibold text-slate-100">
                  {props.report.breakdown.openSpaceScore}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-2.5 py-1.5">
                <span className="text-slate-400/90">Rainfall</span>
                <span className="font-semibold text-slate-100">
                  {props.report.breakdown.rainfallScore}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-2.5 py-1.5">
                <span className="text-slate-400/90">Groundwater</span>
                <span className="font-semibold text-slate-100">
                  {props.report.breakdown.gwScore}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-2.5 py-1.5">
                <span className="text-slate-400/90">Soil</span>
                <span className="font-semibold text-slate-100">
                  {props.report.breakdown.soilScore}
                </span>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={generate}
              disabled={loading || props.assessmentStatus === "processing"}
              className={`
      inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium
      bg-gradient-to-r from-cyan-500/90 via-teal-500/90 to-emerald-500/90
      text-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_45px_rgba(8,47,73,0.55)]
      transition-all duration-200
      hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400
      disabled:opacity-50 disabled:cursor-not-allowed
      ${
        loading || props.assessmentStatus === "processing"
          ? ""
          : "hover:-translate-y-[1px]"
      }
        `}
            >
              {loading || props.assessmentStatus === "processing"
                ? "Generating assessment..."
                : "Generate feasibility report"}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/70 px-5 py-2.5 text-sm font-medium text-slate-200/90 shadow-sm hover:border-slate-400/70 hover:bg-slate-900 transition-colors"
            >
              Refresh data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
