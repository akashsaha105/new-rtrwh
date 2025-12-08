"use client";

import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Overview from "./Overview";
import Feasibility from "./Feasibility";
import RechargeStructure from "./RechargeStructure";
import WaterStorageAnalysis from "./WaterStorageAnalysis";
import GroundRechargeStruct from "./GroundRechargeStruct";
import RecommendedStorageTank from "./RecommendedStorageTank";
import Usage from "./Usage";
import Cost from "./Cost";
import ROI from "./ROI";
import Benefits from "./Benefits";
import Efficiency from "./Efficiency";
import StorageStructures from "./StorageStructures";

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function sqftToM2(sqft: number): number {
  if (!sqft || sqft < 0) return 0;
  return sqft * 0.092903;
}

interface RechargeRequireProps {
  rainfall: number;
  rooftopArea: number;
  rooftopType: string;
  openSpace: number;
  numberOfDwellers: number;
  harvested: number;
}

interface RechargeRecommendProps {
  structure: string;
  details: string;
  dimensions: string;
  match: number;
}

interface City {
  location: {
    city: string;
    lat?: number;
    lng?: number;
  };
}

interface RoofTopData {
  rooftop: {
    area: string;
    type: string;
    dwellers: string;
    space: string;
    runOffCoefficient: string;
  };
}

interface ReportData {
  // from computeFeasibility.ReportOutput, plus legacy fields
  assessmentId: string;
  name?: string;
  avgRainfall_mm: number;
  litres_per_year: number;
  runoffCoefficient?: number;
  feasibilityScore: number;
  category: "High" | "Moderate" | "Low";
  breakdown: {
    roofScore: number;
    openSpaceScore: number;
    rainfallScore: number;
    gwScore: number;
    soilScore: number;
  };
  explanation?: string;
  recommendedStructures: {
    type: string;
    reason?: string;
    confidence?: number;
  }[];
  recommendedDimensions: {
    trench?: { length?: number; width?: number; depth?: number; unit?: string };
    pits?: { count?: number; diameter?: number; depth?: number; unit?: string };
    shaft?: { diameter?: number; depth?: number; unit?: string };
    pit?: {
      // legacy fields kept optional for backward compatibility
      count?: number;
      diameter?: number;
      depth?: number;
      unit?: string;
      // new from computeFeasibility
      diameter_m?: number;
      depth_m?: number;
      volume_m3?: number;
    };
  };
  costEstimate?: {
    CAPEX: number;
    materialCost: number;
    labourCost: number;
    annualSavings: number;
    paybackPeriod: number;
    waterTariff: number;
  };
  generatedAt?: { seconds: number; nanoseconds: number } | string | null;
  pdfUrl?: string | null;

  costBenefit?: {
    installationCost_INR: number;
    annualMaintenance_INR: number;
    expectedLifespan_years: number;
    annualWaterBillSavings_INR: number;
    subsidyEligible: boolean;
    subsidyRate_fraction: number;
    subsidyAmount_INR: number;
    netUpfrontCostAfterSubsidy_INR: number;
    paybackPeriod_years: number | null;
    roi10yr_multiple: number | null;
  };

  environmentalImpact?: {
    co2Saved_kg_per_year: number;
    groundwaterRecharge_litres_per_year: number;
    tankerTripsAvoided_per_year: number;
    sustainabilityRating:
    | "Excellent"
    | "Good"
    | "Fair"
    | "Needs Improvement";
    groundwaterDependencyReduction_pct: number;
    perCapitaWaterSaved_litres_per_year: number | null;
    householdsEquivalentWaterServed: number;
    energySaved_kWh_per_year: number;
    descriptionBullets: string[];
  };
}

async function getCoordinates(cityName: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${cityName}`
    );
    const data = await response.json();
    if (data.length > 0) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);
      return { latitude, longitude };
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error fetching coordinates:", err);
    return null;
  }
}

function sqftToSqm(sqft: number): number {
  const sqm = sqft * 0.092903; // 1 ft² = 0.092903 m²
  return parseFloat(sqm.toFixed(4)); // rounding to 4 decimal places
}

const Assessment = ({ rainfall }: { rainfall: number }) => {
  // const t = useTranslations("assessment");

  // User data state
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [space, setSpace] = useState("");
  const [dwellers, setDwellers] = useState("");
  const [runOffCoefficient, setRunOffCoefficient] = useState("");

  const [mode, setMode] = useState<"jal" | "ai" | null>("jal"); // default open JalYantra

  // Report data state
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentStatus, setAssessmentStatus] = useState<
    "processing" | "done" | "error" | "none"
  >("none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check or create assessment document
  const checkOrCreateAssessment = React.useCallback(
    async (
      uid: string,
      assessmentData: {
        name: string;
        location: { lat: number; lng: number };
        dwellers: number;
        roofArea_m2: number;
        openSpace_m2: number;
        roofMaterial: string;
        roofSlope: string;
      }
    ) => {
      try {
        // Check for existing assessment
        const assessmentsQuery = query(
          collection(firestore, "assessments"),
          where("userId", "==", uid)
        );
        const existingAssessments = await getDocs(assessmentsQuery);
        let assessmentDocId: string;

        if (!existingAssessments.empty) {
          // Use existing assessment and UPDATE it with new data
          const existingAssessment = existingAssessments.docs[0];
          assessmentDocId = existingAssessment.id;

          const assessmentRef = doc(firestore, "assessments", assessmentDocId);
          await setDoc(assessmentRef, {
            ...assessmentData,
            userId: uid,
            updatedAt: serverTimestamp(),
            status: "processing" // Reset status to processing to show loading state
          }, { merge: true });

          setAssessmentStatus("processing");
        } else {
          // Create new assessment
          const newAssessmentRef = doc(collection(firestore, "assessments"));
          assessmentDocId = newAssessmentRef.id;
          setAssessmentStatus("processing");

          await setDoc(newAssessmentRef, {
            ...assessmentData,
            userId: uid,
            status: "processing",
            createdAt: serverTimestamp(),
          });
        }

        // Trigger feasibility calculation immediately
        // We import this dynamically to avoid server/client issues if any
        const { computeFeasibility } = await import("@/lib/computeFeasibility");

        const reportObj = {
          assessmentId: assessmentDocId,
          ...(await computeFeasibility({
            id: assessmentDocId,
            ...assessmentData
          })),
        };

        // Write report
        const reportRef = doc(firestore, "reports", assessmentDocId);
        await setDoc(reportRef, reportObj);

        // Update status to done
        const assessmentRef = doc(firestore, "assessments", assessmentDocId);
        await setDoc(assessmentRef, { status: "done" }, { merge: true });

        // Listen to assessment status (for any external updates)
        const unsubscribeAssessment = onSnapshot(assessmentRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setAssessmentStatus(data.status || "processing");
            if (data.error) {
              setErrorMessage(data.error);
              setLoading(false);
            }
          }
        });

        // Listen to report
        const unsubscribeReport = onSnapshot(reportRef, (snapshot) => {
          if (snapshot.exists()) {
            const reportData = snapshot.data() as ReportData;
            setReport(reportData);
            setAssessmentStatus("done");
            setLoading(false);
          }
        });

        return () => {
          unsubscribeAssessment();
          unsubscribeReport();
        };
      } catch (error) {
        console.error("Error creating/checking assessment:", error);
        setAssessmentStatus("error");
        setErrorMessage("Failed to update assessment. Please try again.");
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Load user data and create/check assessment
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(docRef, async (snapshot) => {
          if (snapshot.exists()) {
            try {
              const data = snapshot.data();

              const getRoofTopData = data as RoofTopData;
              setArea(getRoofTopData.rooftop.area);
              setType(getRoofTopData.rooftop.type);
              setSpace(getRoofTopData.rooftop.space);
              setDwellers(getRoofTopData.rooftop.dwellers);

              setRunOffCoefficient(
                String(getRoofTopData.rooftop.runOffCoefficient)
              );

              const getCity = data as City;

              // Get location coordinates
              let coords: { lat: number; lng: number } | null = null;
              if (
                getCity.location.lat &&
                getCity.location.lng &&
                getCity.location.lat !== 0 &&
                getCity.location.lng !== 0
              ) {
                coords = {
                  lat: getCity.location.lat,
                  lng: getCity.location.lng,
                };
              } else if (getCity.location.city) {
                const fetchedCoords = await getCoordinates(
                  getCity.location.city
                );
                if (
                  fetchedCoords &&
                  fetchedCoords.latitude !== 0 &&
                  fetchedCoords.longitude !== 0
                ) {
                  coords = {
                    lat: fetchedCoords.latitude,
                    lng: fetchedCoords.longitude,
                  };
                }
              }

              // Check if all required data is available
              const hasRequiredData =
                getRoofTopData.rooftop.area &&
                getRoofTopData.rooftop.type &&
                getRoofTopData.rooftop.space &&
                getRoofTopData.rooftop.dwellers;

              const hasValidCoords =
                coords && coords.lat !== 0 && coords.lng !== 0;

              if (hasRequiredData && hasValidCoords && coords) {
                await checkOrCreateAssessment(currentUser.uid, {
                  name: data.fullName || data.username || "Assessment",
                  location: coords,
                  dwellers: parseInt(getRoofTopData.rooftop.dwellers) || 0,
                  roofArea_m2: sqftToSqm(
                    parseFloat(getRoofTopData.rooftop.area)
                  ),
                  openSpace_m2: sqftToSqm(
                    parseFloat(getRoofTopData.rooftop.space)
                  ),
                  roofMaterial: getRoofTopData.rooftop.type,
                  roofSlope: "moderate",
                });
              } else {
                // Missing required data - show appropriate message
                setLoading(false);
                if (!hasRequiredData) {
                  setAssessmentStatus("none");
                  setErrorMessage(
                    "Please complete your profile information (rooftop area, type, space, and dwellers)."
                  );
                } else if (!hasValidCoords) {
                  setAssessmentStatus("none");
                  setErrorMessage(
                    "Please provide a valid city/location in your profile to generate the assessment."
                  );
                }
              }
            } catch (e) {
              console.log(e);
              setLoading(false);
            }
          } else {
            console.log("No Data found");
            setLoading(false);
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [checkOrCreateAssessment]);

  const getRecommendations = async () => {
    setMode("ai");

    if (!data) {
      setAILoading(true);
      try {
        const payload = {
          rainfall: rainfall,
          rooftopArea: area,
          rooftopType: type,
          openSpace: space,
          numberOfDwellers: dwellers,
          harvested: harvestPotential,
        };

        const res1 = await fetch("/api/recommendRecharge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res1.json();

        setData(json);
      } catch (err) {
        console.error("Prediction fetch error:", err);
      } finally {
        setAILoading(false);
      }
    }
  };
  // Calculate derived values from report or fallback
  const harvestPotential =
    sqftToM2(Number(area)) * Number(runOffCoefficient) * mmToM(rainfall) * 1000;
  const roofRainCaptured = sqftToM2(Number(area)) * mmToM(rainfall) * 1000;
  const feasibility = report
    ? {
      feasible: report.category !== "Low",
      reason:
        report.explanation ||
        "Feasibility assessment in progress.",
    }
    : assessmentStatus === "processing"
      ? {
        feasible: false,
        reason:
          "Generating feasibility assessment... This may take a few moments.",
      }
      : assessmentStatus === "error"
        ? {
          feasible: false,
          reason:
            errorMessage ||
            "An error occurred while generating the assessment. Please try again.",
        }
        : assessmentStatus === "none"
          ? {
            feasible: false,
            reason:
              errorMessage ||
              "Please complete your profile information to generate an assessment.",
          }
          : {
            feasible: false,
            reason:
              "Assessment data not available. Please ensure your profile information is complete.",
          };

  const [data, setData] = useState<RechargeRecommendProps | null>(null);
  const [aiLoading, setAILoading] = useState(true);

  return (
    <div className="p-8 relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Dashboard Overview */}
      <Overview area={area} type={type} space={space} dwellers={dwellers} />

      {/* Water Storage Analysis */}
      <WaterStorageAnalysis
        roofRainCaptured={roofRainCaptured}
        harvestPotential={harvestPotential}
        percentage={
          roofRainCaptured > 0
            ? Math.round((harvestPotential / roofRainCaptured) * 100)
            : 0
        }
      />

      {/* Feasibility Check Section  */}
      <Feasibility
        assessmentStatus={assessmentStatus}
        feasibility={feasibility}
        errorMessage={errorMessage}
        report={
          report
            ? {
              assessmentId: report.assessmentId,
              avgRainfall_mm: report.avgRainfall_mm,
              litres_per_year: report.litres_per_year,
              feasibilityScore: report.feasibilityScore,
              category: report.category,
              breakdown: report.breakdown,
              explanation: report.explanation,
            }
            : undefined
        }
      />

      <div className="w-full pt-10">
        {/* Buttons */}
        <div className="flex gap-3 mb-4 justify-evenly">
          <button
            onClick={() => setMode("jal")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer text-xl ${mode === "jal" ? "text-teal-300" : "text-gray-400"
              }`}
          >
            JalYantra Mode
          </button>

          <button
            onClick={() => getRecommendations()}
            className={`px-4 py-2 rounded-xl transition cursor-pointer text-xl ${mode === "ai" ? "text-teal-300" : "text-gray-400"
              }`}
          >
            AI Suggest Mode
          </button>
        </div>

        {/* Divider Line */}
        <div className="w-full h-px bg-white/10 mb-6" />

        {/* Sections */}
        {mode === "jal" && (
          <>
            <GroundRechargeStruct
              recommendedStructures={report?.recommendedStructures}
              recommendedDimensions={report?.recommendedDimensions}
            />
            <RecommendedStorageTank
              feasibility={
                report
                  ? {
                    category: report.category,
                    score: report.feasibilityScore,
                  }
                  : undefined
              }
              recommendedStructures={report?.recommendedStructures}
            />
          </>
        )}

        {mode === "ai" && (
          <>
            {aiLoading ? (
              <p className="text-white/60 text-sm animate-pulse">
                Generating AI predictions…
              </p>
            ) : !data ? (
              <p className="text-red-400 text-sm">
                Failed to load predictions.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
                <div className="flex">
                  <RechargeStructure props={data} />
                </div>

                <div className="flex">
                  <StorageStructures />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Usage Breakdown Pie Chart */}
      <Usage environmentalImpact={report?.environmentalImpact} />

      {/* Cost Estimation & Cost-Benefit Analysis */}
      <Cost
        costBenefit={report?.costBenefit}
        costEstimate={report?.costEstimate}
      />

      {/* ROI */}
      <ROI
        costBenefit={report?.costBenefit}
        costEstimate={report?.costEstimate}
      />

      {/* Interactive Rooftop Efficiency Calculator */}
      <Efficiency />

      {/* Benefits */}
      <Benefits />
    </div>
  );
};

export default Assessment;

export function FeasibilityCardSimple({
  report,
}: {
  report: ReportData | null;
}) {
  if (!report) return null;

  const topStruct =
    report.recommendedStructures && report.recommendedStructures.length > 0
      ? report.recommendedStructures[0]
      : null;

  const pit = report.recommendedDimensions?.pit;

  return (
    <div className="p-4 bg-slate-800 rounded text-white max-w-lg">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-300">Feasibility</div>
          <div className="text-2xl font-bold">
            {report.feasibilityScore} / 100
          </div>
        </div>
        <div className="px-3 py-1 rounded bg-blue-600">
          {report.category}
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-300">
        <div>
          Capture/year:{" "}
          <strong>{report.litres_per_year.toLocaleString()} L</strong>
        </div>
        {topStruct && (
          <div className="mt-2">
            Top suggestion: <strong>{topStruct.type}</strong>
          </div>
        )}
      </div>

      {pit && pit.diameter != null && pit.depth != null && pit.unit && (
        <div className="mt-3 text-sm">
          <div>
            Recommended pit: {pit.diameter} {pit.unit} diameter × {pit.depth}{" "}
            {pit.unit} depth
          </div>
        </div>
      )}
    </div>
  );
}
