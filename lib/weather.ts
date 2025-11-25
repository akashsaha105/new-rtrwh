
// lib/weather.ts

/**
 * Geocode an address string to { lat, lng } using Nominatim (OpenStreetMap).
 * Returns null if not found or error.
 */
export async function getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "RTRWH-App/1.0", // Nominatim requires a User-Agent
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}

/**
 * Fetch average annual rainfall (mm) for a given location using Open-Meteo Historical Weather API.
 * We'll fetch the last 5 full years of daily rain sum and average them.
 */
export async function getAverageRainfall(lat: number, lng: number): Promise<number | null> {
    try {
        // Calculate date range: last 5 full years (e.g., if now is 2024, fetch 2019-01-01 to 2023-12-31)
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 6;
        const endYear = currentYear - 1;
        const startDate = `${startYear}-01-01`;
        const endDate = `${endYear}-12-31`;

        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=rain_sum&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) {
            console.error("Open-Meteo error status:", res.status);
            return null;
        }

        const data = await res.json();
        if (!data.daily || !data.daily.rain_sum) return null;

        const rainSums: number[] = data.daily.rain_sum;
        // Filter out nulls if any
        const validSums = rainSums.filter((v) => v !== null && v !== undefined);

        if (validSums.length === 0) return null;

        const totalRain = validSums.reduce((acc, val) => acc + val, 0);
        const numberOfYears = endYear - startYear + 1;

        // Average annual rainfall
        const avgAnnual = totalRain / numberOfYears;
        return Math.round(avgAnnual);

    } catch (error) {
        console.error("Weather API error:", error);
        return null;
    }
}

/**
 * Fetch soil properties using ISRIC SoilGrids API.
 * Returns a permeability score (0-100) based on sand content.
 * Higher sand % = higher permeability.
 */
export async function getSoilProperties(lat: number, lng: number): Promise<number | null> {
    try {
        // Query for sand, clay, silt at 0-30cm depth
        // ISRIC API: https://rest.isric.org/soilgrids/v2.0/properties/query
        const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lng}&property=sand&property=clay&property=silt&depth=0-30cm&value=mean`;

        const res = await fetch(url);
        if (!res.ok) {
            return getSimulatedSoilPermeability(lat, lng);
        }

        const data = await res.json();

        const sandLayer = data.properties?.layers?.find((l: any) => l.name === "sand");
        if (!sandLayer) {
            return getSimulatedSoilPermeability(lat, lng);
        }

        const sandValue = sandLayer.depths?.[0]?.values?.mean; // g/kg (0-1000)

        if (typeof sandValue !== 'number') {
            return getSimulatedSoilPermeability(lat, lng);
        }

        // Convert g/kg to percentage (0-100)
        const sandPct = sandValue / 10;

        // Simple heuristic: Permeability score roughly equals sand percentage
        return Math.round(sandPct);

    } catch (error) {
        console.error("Soil API error:", error);
        return getSimulatedSoilPermeability(lat, lng);
    }
}

function getSimulatedSoilPermeability(lat: number, lng: number): number {
    // Deterministic simulation
    const seed = Math.abs(lat * lng * 1000);
    const mod = (seed % 60);
    // Return a value between 20 and 80
    return Math.round(20 + mod);
}

/**
 * Simulate groundwater depth based on location.
 * TODO: Replace with real API when available.
 * Returns depth in meters (5-20m).
 */
export function getGroundwaterDepth(lat: number, lng: number): number {
    // Deterministic "random" based on coords
    const seed = Math.abs(lat * lng * 1000);
    const mod = (seed % 1500) / 100; // 0 to 15
    return Number((5 + mod).toFixed(1)); // 5m to 20m
}
