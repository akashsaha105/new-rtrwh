// lib/computeFeasibility.ts
// data we expect from the user 
export type AssessmentInput = {
  id?: string;
  name?: string;
  location?: { lat?: number; lng?: number; address?: string };
  dwellers?: number;
  roofArea_m2?: number;
  openSpace_m2?: number;
  roofMaterial?: string;
  roofSlope_deg?: number;
  // optional pre-filled enrichment (if available)
  avgRainfall_mm?: number;
  gwDepth_m?: number;
  soilPerm?: number;
};

export type ReportOutput = {
  assessmentId?: string;
  litres_per_year: number;
  avgRainfall_mm: number;
  feasibilityScore: number; // 0-100
  category: "High" | "Moderate" | "Low";
  breakdown: {
    roofScore: number;
    openSpaceScore: number;
    rainfallScore: number;
    gwScore: number;
    soilScore: number;
  };
  // high-level explanation for UI
  explanation?: string;
  recommendedStructures: { type: string; confidence: number; reason: string }[];
  recommendedDimensions: {
    // primary recommendation (pit), add trench fields as fallback
    pit?: { diameter_m: number; depth_m: number; volume_m3: number };
    trench?: { width_m: number; depth_m: number; length_m: number };
  };
  generatedAtISO: string;
  costBenefit?: {
    installationCost_INR: number; // CAPEX (before subsidy)
    annualMaintenance_INR: number; // OPEX
    expectedLifespan_years: number;
    annualWaterBillSavings_INR: number;
    subsidyEligible: boolean;
    subsidyRate_fraction: number; // e.g. 0.3 for 30%
    subsidyAmount_INR: number;
    netUpfrontCostAfterSubsidy_INR: number;
    paybackPeriod_years: number | null; // null if not recoverable
    roi10yr_multiple: number | null; // e.g. 3.2 = 3.2x
  };
  environmentalImpact?: {
    co2Saved_kg_per_year: number;
    groundwaterRecharge_litres_per_year: number;
    tankerTripsAvoided_per_year: number;
    sustainabilityRating: "Excellent" | "Good" | "Fair" | "Needs Improvement";
    // new fields for richer dashboard
    groundwaterDependencyReduction_pct: number;
    perCapitaWaterSaved_litres_per_year: number | null;
    householdsEquivalentWaterServed: number;
    energySaved_kWh_per_year: number;
    descriptionBullets: string[];
  };
};

// Defaults & constants (tune for your region)
// These are the "magic numbers" used for calculations when real data is missing or for standard engineering assumptions.
const RUNOFF_COEFF = 0.85;
const DEFAULT_RAIN_MM = 800;
const DEFAULT_GW_DEPTH_M = 15;
const DEFAULT_SOIL_PERM = 40; // 0-100
const TARGET_RECHARGE_FRACTION = 0.5;
const PIT_EFFICIENCY = 0.6;

// Emission factors & tanker assumptions (heuristics)
const CO2_PER_KL_PUMPING_KG = 0.3; // kg CO₂ per 1000L pumped
const CO2_PER_KL_TANKER_KG = 0.6; // kg CO₂ per 1000L tanker water
const TANKER_VOLUME_L = 6000; // typical tanker size in litres

// Additional impact heuristics
const BASE_GW_DEPENDENCY_REDUCTION_PCT = 30; // headline “up to 30%”
const L_PER_PERSON_PER_DAY = 135; // typical urban demand
const PEOPLE_PER_HOUSEHOLD = 4;
const KWH_PER_KL_PUMPING = 0.6; // energy to pump 1kL

// normalize helper (0..100)
// A utility to normalize any value into a 0-100 score. For example, if rainfall is between 200mm (score 0) and 2000mm (score 100), this function calculates where the actual rainfall lands on that scale.
function norm(value: number, min: number, max: number) {
  if (!isFinite(value)) return 0;
  if (value <= min) return 0;
  if (value >= max) return 100;
  return Math.round(((value - min) / (max - min)) * 100);
}
// the core physics formula: Area * Rainfall * Efficiency
function calcRunoffLitresPerYear(
  area_m2: number,
  avgRain_mm: number,
  runoffCoeff = RUNOFF_COEFF
) {
  // 1 mm on 1 m^2 = 1 litre
  return Math.round(area_m2 * avgRain_mm * runoffCoeff);
}


// Calculates how big a recharge pit needs to be based on the volume of water captured. It uses geometry math (cylinder volume) to determine diameter and depth.

function computePitDimensions(
  litresPerYear: number,
  targetFraction = TARGET_RECHARGE_FRACTION,
  pitEff = PIT_EFFICIENCY
) {
  const targetM3 = (litresPerYear * targetFraction) / 1000; // litres -> cubic meters
  const pitVolume = targetM3 / pitEff; // m3 needed
  // choose depth heuristic: between 0.8m and 2.0m
  const depth = Math.max(0.8, Math.min(2.0, Math.sqrt(pitVolume)));
  const diameter = Math.sqrt((4 * pitVolume) / (Math.PI * depth)); // cylinder
  return {
    pit: {
      diameter_m: Number(diameter.toFixed(2)),
      depth_m: Number(depth.toFixed(2)),
      volume_m3: Number(pitVolume.toFixed(3)),
    },
    targetM3: Number(targetM3.toFixed(3)),
  };
}

import { getAverageRainfall, getCoordinates, getSoilProperties, getGroundwaterDepth } from "./weather";

export async function computeFeasibility(assess: AssessmentInput): Promise<ReportOutput> {
  // safe pulls + defaults
  const roofArea = Number(assess.roofArea_m2 ?? 0);
  const openSpace = Number(assess.openSpace_m2 ?? 0);
  let avgRain = Number(assess.avgRainfall_mm ?? 0);
  let gwDepth = Number(assess.gwDepth_m ?? 0);
  let soilPerm = Number(assess.soilPerm ?? 0);
  const dwellers = Number.isFinite(assess.dwellers ?? NaN)
    ? Number(assess.dwellers)
    : null;

  // Resolve Location first (needed for all APIs)
  let lat = assess.location?.lat;
  let lng = assess.location?.lng;

  if ((!lat || !lng) && assess.location?.address) {
    const coords = await getCoordinates(assess.location.address);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }
  }

  // If we have valid coords, fetch missing data
  if (lat && lng) {
    // 1. Rainfall
    if (!avgRain) {
      const fetchedRain = await getAverageRainfall(lat, lng);
      if (fetchedRain) avgRain = fetchedRain;
    }

    // 2. Soil Permeability
    if (!soilPerm) {
      const fetchedSoil = await getSoilProperties(lat, lng);
      if (fetchedSoil !== null) soilPerm = fetchedSoil;
    }

    // 3. Groundwater Depth
    if (!gwDepth) {
      const fetchedGw = getGroundwaterDepth(lat, lng);
      gwDepth = fetchedGw;
    }
  }

  // Apply defaults for anything still missing
  if (!avgRain) avgRain = DEFAULT_RAIN_MM;
  if (!gwDepth) gwDepth = DEFAULT_GW_DEPTH_M;
  if (!soilPerm) soilPerm = DEFAULT_SOIL_PERM;

  // runoff
  const litres_per_year = calcRunoffLitresPerYear(roofArea, avgRain);

  // normalized component scores (0-100)
  const roofScore = norm(roofArea, 10, 200); // small roof <10 poor, >200 excellent
  const openSpaceScore = norm(openSpace, 0, 50); // 0-50 m2 mapping
  const rainfallScore = norm(avgRain, 200, 2000); // 200–2000mm
  const gwScore = norm(Math.max(0, 50 - gwDepth), 0, 50); // shallower GW => higher score
  const soilScore = norm(soilPerm, 10, 100); // permeability 10..100

  // weighted feasibility score
  const feasibilityScore = Math.round(
    0.3 * roofScore +
    0.2 * openSpaceScore +
    0.2 * rainfallScore +
    0.15 * gwScore +
    0.15 * soilScore
  );

  const category =
    feasibilityScore >= 80
      ? "High"
      : feasibilityScore >= 50
        ? "Moderate"
        : "Low";

  // simple explanation text
  const explanationParts: string[] = [];
  if (roofScore >= 70) explanationParts.push("large or efficient rooftop area boosted the score");
  else if (roofScore < 30) explanationParts.push("limited rooftop area reduced feasibility");

  if (openSpaceScore >= 70) explanationParts.push("good open space availability supported trench/pit options");
  else if (openSpaceScore < 30) explanationParts.push("limited open space restricted on‑ground structures");

  if (rainfallScore >= 70) explanationParts.push("high annual rainfall increased potential capture");
  else if (rainfallScore < 30) explanationParts.push("low rainfall reduced total harvest potential");

  if (soilScore >= 70) explanationParts.push("good soil permeability improved recharge potential");
  else if (soilScore < 30) explanationParts.push("poor soil permeability constrained recharge performance");

  const explanation =
    explanationParts.length > 0
      ? `Overall feasibility is ${category.toLowerCase()} (${feasibilityScore}/100) because ${explanationParts.join(
        "; "
      )}.`
      : `Overall feasibility is ${category.toLowerCase()} (${feasibilityScore}/100).`;

  // recommendation rules (deterministic)
  const recommendedStructures: ReportOutput["recommendedStructures"] = [];
  if (openSpace >= 10 && soilPerm >= 25) {
    recommendedStructures.push({
      type: "Trench + multiple recharge pits",
      confidence: 0.9,
      reason: "Ample open space and decent soil infiltration.",
    });
  } else if (openSpace >= 4 && soilPerm >= 20) {
    recommendedStructures.push({
      type: "Recharge pit(s)",
      confidence: 0.8,
      reason: "Moderate open space; pits are practical.",
    });
  } else if (openSpace < 4 && gwDepth <= 15) {
    recommendedStructures.push({
      type: "Recharge shaft / well (professional)",
      confidence: 0.75,
      reason: "Limited open space, shallow groundwater favors shaft.",
    });
  } else {
    recommendedStructures.push({
      type: "Site inspection / percolation test",
      confidence: 0.5,
      reason:
        "Insufficient open space or low permeability; on-site test recommended.",
    });
  }
  // additional suggestion: conveyance to community recharge if roof very large but open space small
  if (roofArea > 100 && openSpace < 30) {
    recommendedStructures.unshift({
      type: "Convey runoff to community recharge or borewell (if available)",
      confidence: 70,
      reason: "Large catchment but limited on-site space.",
    });
  }

  // --- Cost & benefit estimation logic ---

  // Heuristic installation cost (CAPEX) in INR
  // Base + per m2 of roof and open space, then clamp to a reasonable range
  const baseCapex = 40000; // base ticket
  const roofCapex = roofArea * 300; // per m2 of roof
  const openCapex = openSpace * 500; // per m2 of open space used
  let installationCost_INR = baseCapex + roofCapex + openCapex;
  installationCost_INR = Math.max(
    60000,
    Math.min(installationCost_INR, 250000)
  );

  // Annual maintenance ~ 3–6% of CAPEX
  const annualMaintenance_INR = Math.round(installationCost_INR * 0.045);

  // Assume effective tariff (₹/kL = ₹ per 1000L)
  const WATER_TARIFF_PER_KL = 35; // tune for your locality
  const annualWaterBillSavings_INR = Math.round(
    (litres_per_year / 1000) * WATER_TARIFF_PER_KL * TARGET_RECHARGE_FRACTION
  );

  // Subsidy heuristic:
  // Eligible if feasibility is at least Moderate and roofArea >= 50 m2
  const subsidyEligible = feasibilityScore >= 50 && roofArea >= 50;
  const subsidyRate_fraction = subsidyEligible ? 0.3 : 0; // up to 30%
  const subsidyAmount_INR = Math.round(
    installationCost_INR * subsidyRate_fraction
  );
  const netUpfrontCostAfterSubsidy_INR =
    installationCost_INR - subsidyAmount_INR;

  // Payback period (years)
  let paybackPeriod_years: number | null = null;
  if (annualWaterBillSavings_INR > 0) {
    paybackPeriod_years = Number(
      (netUpfrontCostAfterSubsidy_INR / annualWaterBillSavings_INR).toFixed(1)
    );
  }

  // 10-year ROI multiple = (total net benefit over 10 yrs) / net upfront cost
  let roi10yr_multiple: number | null = null;
  if (paybackPeriod_years !== null && netUpfrontCostAfterSubsidy_INR > 0) {
    const totalSavings10yr = annualWaterBillSavings_INR * 10;
    const totalMaintenance10yr = annualMaintenance_INR * 10;
    const netBenefit10yr = totalSavings10yr - totalMaintenance10yr;
    roi10yr_multiple = Number(
      (netBenefit10yr / netUpfrontCostAfterSubsidy_INR).toFixed(2)
    );
  }

  // --- Environmental impact estimation ---

  // Groundwater recharge (litres/year) from rooftop runoff
  const groundwaterRecharge_litres_per_year = Math.round(
    litres_per_year * TARGET_RECHARGE_FRACTION
  );

  // Assume 50% of avoided external water is tanker, 50% pumped groundwater
  const klAvoided = groundwaterRecharge_litres_per_year / 1000;
  const co2Saved_kg_per_year = Number(
    (
      klAvoided *
      (0.5 * CO2_PER_KL_TANKER_KG + 0.5 * CO2_PER_KL_PUMPING_KG)
    ).toFixed(1)
  );

  // Tanker trips avoided per year
  const tankerTripsAvoided_per_year = Number(
    (groundwaterRecharge_litres_per_year / TANKER_VOLUME_L).toFixed(1)
  );

  // Map feasibility score to sustainability rating
  let sustainabilityRating: "Excellent" | "Good" | "Fair" | "Needs Improvement";
  if (feasibilityScore >= 80) {
    sustainabilityRating = "Excellent";
  } else if (feasibilityScore >= 60) {
    sustainabilityRating = "Good";
  } else if (feasibilityScore >= 40) {
    sustainabilityRating = "Fair";
  } else {
    sustainabilityRating = "Needs Improvement";
  }

  // Groundwater dependency reduction:
  // scale 30% headline with feasibility (0–100) => 0–30%
  const groundwaterDependencyReduction_pct = Number(
    ((BASE_GW_DEPENDENCY_REDUCTION_PCT * feasibilityScore) / 100).toFixed(1)
  );

  // Per-capita water saved per year, if dwellers known
  const perCapitaWaterSaved_litres_per_year =
    dwellers && dwellers > 0
      ? Number((litres_per_year / dwellers).toFixed(1))
      : null;

  // Household-equivalent water served per year
  const yearlyPerHouseholdNeed_L =
    L_PER_PERSON_PER_DAY * PEOPLE_PER_HOUSEHOLD * 365;
  const householdsEquivalentWaterServed = Number(
    (litres_per_year / yearlyPerHouseholdNeed_L).toFixed(1)
  );

  // Energy saved in pumping (kWh/year)
  const energySaved_kWh_per_year = Number(
    (klAvoided * KWH_PER_KL_PUMPING).toFixed(1)
  );

  // Human-readable bullets for dashboard cards
  const descriptionBullets: string[] = [
    `Reduce ~${groundwaterDependencyReduction_pct}% dependency on groundwater`,
    `Save about ${litres_per_year.toLocaleString()} litres of water every year`,
    `Recharge local aquifers with ~${groundwaterRecharge_litres_per_year.toLocaleString()} litres/year`,
    `Avoid ~${tankerTripsAvoided_per_year} tanker trips annually`,
    `Avoid ~${co2Saved_kg_per_year} kg of CO₂ emissions per year`,
    `Save ~${energySaved_kWh_per_year} kWh of electricity used for pumping`,
  ];

  // compute dimensions (pit primary)
  const dims = computePitDimensions(litres_per_year);

  return {
    assessmentId: assess.id,
    litres_per_year,
    avgRainfall_mm: avgRain,
    feasibilityScore,
    category,
    breakdown: { roofScore, openSpaceScore, rainfallScore, gwScore, soilScore },
    explanation,
    recommendedStructures,
    recommendedDimensions: {
      pit: dims.pit,
      trench: {
        width_m: 0.6,
        depth_m: 0.8,
        length_m: Number((dims.pit.volume_m3 / (0.6 * 0.8)).toFixed(2)),
      },
    },
    generatedAtISO: new Date().toISOString(),
    costBenefit: {
      installationCost_INR,
      annualMaintenance_INR,
      expectedLifespan_years: 15,
      annualWaterBillSavings_INR,
      subsidyEligible,
      subsidyRate_fraction,
      subsidyAmount_INR,
      netUpfrontCostAfterSubsidy_INR,
      paybackPeriod_years,
      roi10yr_multiple,
    },
    environmentalImpact: {
      co2Saved_kg_per_year,
      groundwaterRecharge_litres_per_year,
      tankerTripsAvoided_per_year,
      sustainabilityRating,
      groundwaterDependencyReduction_pct,
      perCapitaWaterSaved_litres_per_year,
      householdsEquivalentWaterServed,
      energySaved_kWh_per_year,
      descriptionBullets,
    },
  };
}
