import { getPreviousMonthRange } from "@/utils/date";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // ---- 1. Read lat/lon from query ----
    const lat = req.nextUrl.searchParams.get("lat");
    const lon = req.nextUrl.searchParams.get("lon");

    // ---- Force user to provide lat/lon ----
    if (!lat || !lon) {
      return NextResponse.json(
        {
          error:
            "Latitude and longitude are required. Example: /api/monthly-rainfall-current?lat=22.57&lon=88.36",
        },
        { status: 400 }
      );
    }

    // ---- 2. Detect current year + month ----
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    // ---- 3. Build date range (start → last day of month) ----
    const startDate = new Date(year, prevMonth, 1);
    const endDate = new Date(year, prevMonth + 1, 0);

    const format = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      const start = format(startDate);
      const end = format(endDate);
    
    // ---- 4. Build Open-Meteo API URL ----
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${19.076}&longitude=${72.8777}&daily=rain_sum&timezone=auto&start_date=${start}&end_date=${end}`;

    const response = await fetch(url);
    const data = await response.json();

    // ---- 5. Validate response ----
    if (!data.daily || !Array.isArray(data.daily.rain_sum)) {
      return NextResponse.json(
        { error: "Failed to fetch rainfall data from Open-Meteo" },
        { status: 502 }
      );
    }

    // ---- 6. Sum up total rainfall ----
    const totalRainfall = data.daily.rain_sum.reduce(
      (sum: number, value: number) => sum + (value || 0),
      0
    );

    // ---- 7. Return final JSON ----
    return NextResponse.json({
      year,
      month,
      monthName: now.toLocaleString("en-US", { month: "long" }),
      latitude: lat,
      longitude: lon,
      startDate: start,
      endDate: end,
      totalRainfallMM: Number(totalRainfall.toFixed(2)),
      dailyRainfall: data.daily.rain_sum,
    });
  } catch (err) {
    console.error("Rainfall API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
