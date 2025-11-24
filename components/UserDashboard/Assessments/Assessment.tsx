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
import AquiferMap from "./AquiferMap";
import MajorAquifersMap from "./AquiferMap";
import LoadingPage from "@/components/Loading";
import GISMap from "./GISMap";

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function sqftToM2(sqft: number): number {
  if (!sqft || sqft < 0) return 0;
  return sqft * 0.092903;
}

// interface RechargeRequireProps {
//   rainfall: number;
//   rooftopArea: number;
//   rooftopType: string;
//   openSpace: number;
//   numberOfDwellers: number;
//   harvested: number;
// }

interface RechargeRecommendProps {
  structure: string;
  details: string;
  dimensions: string;
  match: number;
}

interface StorageRecommendProps {
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
  assessmentId: string;
  name?: string;
  avgRainfall_mm: number;
  litres_per_year: number;
  runoffCoefficient: number;
  report: {
    feasibilityScore: number;
    category: "High" | "Moderate" | "Low";
    breakdown: {
      roofScore: number;
      openSpaceScore: number;
      rainfallScore: number;
      gwScore: number;
      soilScore: number;
    };
  };
  explanation: string;
  recommendedStructures: {
    type: string;
    reason?: string;
    confidence?: number;
  }[];
  recommendedDimensions: {
    trench?: { length: number; width: number; depth: number; unit: string };
    pits?: { count: number; diameter: number; depth: number; unit: string };
    shaft?: { diameter: number; depth: number; unit: string };
    pit?: { count: number; diameter: number; depth: number; unit: string };
  };
  costEstimate: {
    CAPEX: number;
    materialCost: number;
    labourCost: number;
    annualSavings: number;
    paybackPeriod: number;
    waterTariff: number;
  };
  generatedAt: { seconds: number; nanoseconds: number } | null;
  pdfUrl?: string | null;

  // NEW: align with computeFeasibility.ts
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

  environmentalImpact: {
    co2Saved_kg_per_year: number;
    groundwaterRecharge_litres_per_year: number;
    tankerTripsAvoided_per_year: number;
    sustainabilityRating: number;
    groundwaterDependencyReduction_pct: number;
    perCapitaWaterSaved_litres_per_year: number;
    householdsEquivalentWaterServed: number;
    energySaved_kWh_per_year: number;
    descriptionBullets: number;
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
          // Use existing assessment
          const existingAssessment = existingAssessments.docs[0];
          assessmentDocId = existingAssessment.id;
          const assessmentData = existingAssessment.data();
          setAssessmentStatus(assessmentData.status || "processing");
          if (assessmentData.error) {
            setErrorMessage(assessmentData.error);
          }
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

        // Listen to assessment status
        const assessmentRef = doc(firestore, "assessments", assessmentDocId);
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

        // Listen to report with maximum wait time
        const reportRef = doc(firestore, "reports", assessmentDocId);
        let reportCheckTimeout: NodeJS.Timeout | null = null;
        const maxWaitTime = 10000; // 15 seconds maximum wait
        const startTime = Date.now();

        // Set maximum timeout
        const maxTimeout = setTimeout(() => {
          if (!report) {
            setLoading(false);
            setAssessmentStatus("error");
            setErrorMessage(
              "Assessment is taking longer than expected. Please refresh the page."
            );
          }
        }, maxWaitTime);

        const unsubscribeReport = onSnapshot(reportRef, (snapshot) => {
          if (snapshot.exists()) {
            const reportData = snapshot.data() as ReportData;
            setReport(reportData);
            setAssessmentStatus("done");
            setLoading(false);
            clearTimeout(maxTimeout);
            if (reportCheckTimeout) {
              clearTimeout(reportCheckTimeout);
              reportCheckTimeout = null;
            }
          } else {
            // Check if we've exceeded max wait time
            const elapsed = Date.now() - startTime;
            if (elapsed > maxWaitTime) {
              clearTimeout(maxTimeout);
              setLoading(false);
              setAssessmentStatus("error");
              setErrorMessage("Assessment timeout. Please try again.");
              return;
            }

            // Check assessment status to determine if we should wait
            const assessmentDoc = doc(
              firestore,
              "assessments",
              assessmentDocId
            );
            getDoc(assessmentDoc)
              .then((assessmentSnap) => {
                if (assessmentSnap.exists()) {
                  const assessmentData = assessmentSnap.data();
                  const status = assessmentData?.status || "processing";

                  if (status === "error") {
                    clearTimeout(maxTimeout);
                    setAssessmentStatus("error");
                    setErrorMessage(assessmentData?.error || "Unknown error");
                    setLoading(false);
                  } else if (status === "done") {
                    // Assessment marked as done but report missing - wait a bit
                    if (!reportCheckTimeout) {
                      reportCheckTimeout = setTimeout(() => {
                        clearTimeout(maxTimeout);
                        setLoading(false);
                      }, 2000); // Reduced to 2 seconds
                    }
                  } else {
                    // Still processing, keep loading (but check timeout)
                    if (elapsed < maxWaitTime) {
                      setLoading(true);
                    }
                  }
                } else {
                  clearTimeout(maxTimeout);
                  setLoading(false);
                }
              })
              .catch(() => {
                clearTimeout(maxTimeout);
                setLoading(false);
              });
          }
        });

        return () => {
          unsubscribeAssessment();
          unsubscribeReport();
          clearTimeout(maxTimeout);
          if (reportCheckTimeout) {
            clearTimeout(reportCheckTimeout);
          }
        };
      } catch (error) {
        console.error("Error creating/checking assessment:", error);
        setAssessmentStatus("error");
        setErrorMessage("Failed to create assessment. Please try again.");
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

              // async function loadPrediction() {
              //   try {
              //     const payload = {
              //       rainfall: rainfall,
              //       rooftopArea: getRoofTopData.rooftop.area,
              //       rooftopType: getRoofTopData.rooftop.type,
              //       openSpace: getRoofTopData.rooftop.space,
              //       numberOfDwellers: getRoofTopData.rooftop.dwellers,
              //       harvested: harvestPotential,
              //     };

              //     const res1 = await fetch("/api/recommendRecharge", {
              //       method: "POST",
              //       headers: { "Content-Type": "application/json" },
              //       body: JSON.stringify(payload),
              //     });

              //     const json = await res1.json();

              //     setData(json);
              //   } catch (err) {
              //     console.error("Prediction fetch error:", err);
              //   } finally {
              //     setAILoading(false);
              //   }
              // }

              // loadPrediction();

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

        const res2 = await fetch("/api/recommendStorage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res1.json();
        const json2 = await res2.json();

        setData(json);
        setData2(json2);
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
        feasible: report.report?.category !== "Low",
        reason: report.explanation || "Feasibility assessment in progress.",
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
  // if (loading && assessmentStatus === "processing") {
  //   return (
  //     <div className="p-8 relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
  //         <p className="text-slate-300">Generating feasibility assessment...</p>
  //         <p className="text-slate-400 text-sm mt-2">
  //           This may take 10-30 seconds
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  const [data, setData] = useState<RechargeRecommendProps | null>(null);
  const [data2, setData2] = useState<StorageRecommendProps | null>(null);
  const [aiLoading, setAILoading] = useState(true);

  // const [Structure, setStructure] = useState("");
  // const [details, setDetails] = useState("");
  // const [dimensions, setDimensions] = useState("");
  // const [match, setMatch] = useState("");

  // useEffect(() => {
  //   async function loadPrediction() {
  //     try {
  //       const payload = {
  //         rainfall: rainfall,
  //         rooftopArea: area,
  //         rooftopType: type,
  //         openSpace: space,
  //         numberOfDwellers: dwellers,
  //         harvested: harvestPotential,
  //       };

  //       const res1 = await fetch("/api/recommendRecharge", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(payload),
  //       });

  //       const json = await res1.json();

  //       setData(json);
  //     } catch (err) {
  //       console.error("Prediction fetch error:", err);
  //     } finally {
  //       setAILoading(false);
  //     }
  //   }

  //   loadPrediction();
  // }, []);

  const [harvestMode, setHarvestMode] = useState("harvest");
  const [modeLoading, setModeLoading] = useState(false);

  function switchMode(mode: "harvest" | "aquifer") {
    setModeLoading(true);
    setHarvestMode(mode);

    // force 5-second load
    setTimeout(() => {
      setModeLoading(false);
    }, 1000);
  }

  return (
    <div className="p-8 relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Buttons */}
      <div className="flex flex-col justify-center items-center">
        <div className="flex gap-3 mb-4 justify-evenly">
          <button
            onClick={() => {
              switchMode("harvest");
            }}
            className={`px-4 py-2 rounded-xl transition cursor-pointer text-md ${
              harvestMode === "harvest"
                ? "text-teal-300"
                : "text-gray-400 hover:text-teal-500"
            }`}
          >
            ANALYSIS ASSESSMENT
          </button>

          <button
            onClick={() => switchMode("aquifer")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer text-md outline-0 ${
              harvestMode === "aquifer"
                ? "text-teal-300"
                : "text-gray-400 hover:text-teal-500"
            }`}
          >
            GIS BASED MAP
          </button>
        </div>
        {/* Divider Line */}
        <div className="w-75 h-px bg-white/10 mb-6" />
      </div>

      {modeLoading ? (
        <div className="relative bottom-[170]">
          <div className="p-8 relative min-h-screen bg-none flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading...</p>
              <p className="text-slate-400 text-sm mt-2">
                This may take 10-30 seconds
              </p>
            </div>
          </div>{" "}
        </div>
      ) : harvestMode === "harvest" ? (
        <>
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
            report={report?.report}
          />

          <div className="w-full pt-10">
            {/* Buttons */}
            <div className="flex flex-col justify-center items-center">
              <div className="flex gap-3 mb-4 justify-evenly">
                <button
                  onClick={() => setMode("jal")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer text-md ${
                    mode === "jal"
                      ? "text-teal-300"
                      : "text-gray-400 hover:text-teal-500"
                  }`}
                >
                  JalYantra Mode
                </button>

                <button
                  onClick={() => getRecommendations()}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer text-md ${
                    mode === "ai"
                      ? "text-teal-300"
                      : "text-gray-400 hover:text-teal-500"
                  }`}
                >
                  AI Suggest Mode
                </button>
              </div>
              {/* Divider Line */}
              <div className="w-75 h-px bg-white/10 mb-6" />
            </div>

            {/* Sections */}
            {mode === "jal" && (
              <>
                <GroundRechargeStruct />
                <RecommendedStorageTank />
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
                      {/* <GroundRechargeStruct /> */}
                      <RechargeStructure props={data} />
                    </div>

                    <div className="flex">
                      <StorageStructures props={data2} />
                      {/* <RecommendedStorageTank /> */}
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
          <ROI />

          {/* Interactive Rooftop Efficiency Calculator */}
          <Efficiency />

          {/* Benefits */}
          <Benefits />
        </>
      ) : (
        <>
          <GISMap />
        </>
      )}
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
            {report.report.feasibilityScore} / 100
          </div>
        </div>
        <div className="px-3 py-1 rounded bg-blue-600">
          {report.report.category}
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

      {pit && (
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
