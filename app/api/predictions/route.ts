import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      rainfall,
      harvested,
      tankUtilization,
      rechargeUtilization,
      storageEfficiency,
      rechargeEfficiency,
      overflowLoss,
      infiltrationRate,
    } = body;

    const prompt = `
      Return ONLY valid minified JSON.
      No explanation, no markdown, no natural language.

      Compute:
        predictedStorage = harvested - overflowLoss
        extraStorageNeeded = overflowLoss
        demandCoverage = (harvested - overflowLoss) / harvested
        paybackYears = (storageEfficiency + rechargeEfficiency) / (tankUtilization + rechargeUtilization)

      Input:
      rainfall: ${rainfall}
      harvested: ${harvested}
      tankUtilization: ${tankUtilization}
      rechargeUtilization: ${rechargeUtilization}
      storageEfficiency: ${storageEfficiency}
      rechargeEfficiency: ${rechargeEfficiency}
      overflowLoss: ${overflowLoss}
      infiltrationRate: ${infiltrationRate}

      Respond like:
      {"predictedStorage":260,"extraStorageNeeded":100,"paybackYears":16.65,"demandCoverage":0.7222, "overflowRisk": "High" | "Moderate" | "Low"}
    `;

    const genAI = new GoogleGenerativeAI("AIzaSyB7Fm_YjQ-SJZIuPH10NigNZngkzzejLi");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const response = await model.generateContent(prompt);
    let raw = response.response.text() || "";

    // 🔥 NEW: Clean entire garbage from AI response
    raw = raw
      .replace(/```json|```/g, "")
      .replace(/[\n\r]/g, "")
      .trim();

    // 🔥 NEW: Extract ONLY the JSON object using regex
    const match = raw.match(/{.*}/);
    if (!match) {
      throw new Error("No JSON found in Gemini output");
    }

    const safeJson = match[0];

    // 🔥 NEW: Always safe-parse JSON
    const data = JSON.parse(safeJson);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Prediction API Error:", error);

    return NextResponse.json(
      { error: "Failed to generate predictions. Try again." },
      { status: 500 }
    );
  }
}
