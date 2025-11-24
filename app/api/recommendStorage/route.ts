import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      rainfall,
      rooftopArea,
      rooftopType,
      noOfDwellers,
      openSpace,
      harvested,
    } = body;

    const prompt = `
You are an expert in Rooftop Rainwater Harvesting and Groundwater Recharge. 
Based on the following input parameters:

- Rainfall: ${rainfall} mm
- Rooftop Area: ${rooftopArea} sq. ft.
- Rooftop Type: ${rooftopType}
- Number of Dwellers: ${noOfDwellers}
- Available Open Space: ${openSpace} sq. ft.
- Estimated Harvested Water: ${harvested} liters

Analyze the user's rooftop and environmental suitability and recommend the MOST appropriate Overhead Storage Tank structure.

Provide your response STRICTLY in this dictionary format:

{
  "details": "<15-20 words explaining why this is the ideal structure based on the inputs>",
  "dimensions": "<recommended dimensions in clear format with no other information based on rooftop area, roof type, no.of dwellers and open space, e.g., **'2m × 2m × 2m' or '5m × 1m × 2m'**>",
  "match": "<a numeric confidence score between 60-95 based on suitability>"
}

Rules:
- Base the reasoning on rainfall intensity, roof area, soil absorption, space availability, and expected water volume.
- NEVER include explanations outside the dictionary.
- Always fill all dictionary fields.
    `;

    const genAI = new GoogleGenerativeAI(
      "AIzaSyDObVhafnFaIusA46GFu0CjaQGDOLQ4J_I"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
