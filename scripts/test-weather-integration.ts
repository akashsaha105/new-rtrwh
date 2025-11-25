
import { getCoordinates, getAverageRainfall, getSoilProperties, getGroundwaterDepth } from "../lib/weather";
import { computeFeasibility } from "../lib/computeFeasibility";

async function runTests() {
    console.log("--- Testing Weather, Soil, and Groundwater API Integration ---");

    // Test 1: Geocoding
    console.log("\n1. Testing Geocoding (Bangalore)...");
    const coords = await getCoordinates("Bangalore");
    console.log("Coordinates:", coords);
    if (coords && coords.lat && coords.lng) {
        console.log("✅ Geocoding success");
    } else {
        console.error("❌ Geocoding failed");
    }

    if (coords) {
        // Test 2: Rainfall Fetching
        console.log("\n2. Testing Rainfall Fetching...");
        const rainfall = await getAverageRainfall(coords.lat, coords.lng);
        console.log("Average Annual Rainfall (mm):", rainfall);
        if (rainfall && rainfall > 0) {
            console.log("✅ Rainfall fetch success");
        } else {
            console.error("❌ Rainfall fetch failed");
        }

        // Test 3: Soil Properties
        console.log("\n3. Testing Soil Properties (SoilGrids)...");
        const soilPerm = await getSoilProperties(coords.lat, coords.lng);
        console.log("Soil Permeability Score (0-100):", soilPerm);
        if (soilPerm !== null && soilPerm >= 0 && soilPerm <= 100) {
            console.log("✅ Soil data fetch success");
        } else {
            console.error("❌ Soil data fetch failed");
        }

        // Test 4: Groundwater Depth (Simulation)
        console.log("\n4. Testing Groundwater Depth (Simulation)...");
        const gwDepth = getGroundwaterDepth(coords.lat, coords.lng);
        console.log("Groundwater Depth (m):", gwDepth);
        if (gwDepth >= 5 && gwDepth <= 20) {
            console.log("✅ GW depth simulation success");
        } else {
            console.error("❌ GW depth simulation failed");
        }
    }

    // Test 5: computeFeasibility with address
    console.log("\n5. Testing computeFeasibility with address (full integration)...");
    const inputWithAddress = {
        roofArea_m2: 100,
        openSpace_m2: 20,
        location: { address: "Chennai" }, // Chennai
    };
    const report1 = await computeFeasibility(inputWithAddress);
    console.log("Report 1 (Chennai):");
    console.log("- Rainfall used:", report1.avgRainfall_mm);
    console.log("- Soil Perm Score:", report1.breakdown.soilScore); // Note: breakdown score is normalized, check raw input if possible or infer
    console.log("- GW Depth Score:", report1.breakdown.gwScore);

    // We can't easily check raw input values from report output, but we can check if they are non-zero/non-default if defaults were different.
    // Default rain=800. Chennai should be higher (~1400).
    if (report1.avgRainfall_mm !== 800 && report1.avgRainfall_mm > 0) {
        console.log("✅ Dynamic rainfall used");
    } else {
        console.log("⚠️ Used default or 0 rainfall");
    }

    // Test 6: computeFeasibility with explicit values (should override API)
    console.log("\n6. Testing computeFeasibility with explicit values...");
    const inputWithExplicit = {
        roofArea_m2: 100,
        openSpace_m2: 20,
        avgRainfall_mm: 500,
        gwDepth_m: 10,
        soilPerm: 80,
    };
    const report2 = await computeFeasibility(inputWithExplicit);
    console.log("Report 2 (Explicit):");
    console.log("- Rainfall used:", report2.avgRainfall_mm);
    // We can infer usage from scores or just trust the logic if rainfall works.

    if (report2.avgRainfall_mm === 500) {
        console.log("✅ Explicit rainfall respected");
    } else {
        console.error("❌ Explicit rainfall ignored");
    }
}

runTests().catch(console.error);
