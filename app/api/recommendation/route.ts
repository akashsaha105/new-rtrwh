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
You are an expert water resource engineer.

Based on the following metrics:
Rainfall: ${rainfall}
Harvested: ${harvested}
Tank Utilization: ${tankUtilization}
Recharge Utilization: ${rechargeUtilization}
Storage Efficiency: ${storageEfficiency}
Recharge Efficiency: ${rechargeEfficiency}
Overflow Loss: ${overflowLoss}
Infiltration Rate: ${infiltrationRate}

Generate EXACTLY a JavaScript array of strings.

Example format:
[
  "Recommendation 1",
  "Recommendation 2",
  "Recommendation 3"
]

The array must contain 5–8 specific and actionable recommendations in 8-10 words for improving BOTH:
- storage tank
- recharge pit

IMPORTANT:
- Do NOT include headings.
- Do NOT include markdown.
- Do NOT include explanations.
- ONLY return a pure JS array.
    `;

    const genAI = new GoogleGenerativeAI(
      "AIzaSyDuX1kImJocVGuKDwXH-XVJKVGNQUJutMg"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();

    // PURE array extraction
    const match = raw.match(/\[([\s\S]*)\]/);
    if (!match) throw new Error("Gemini did not return an array");

    const arr = JSON.parse(match[0]); // safe parse

    return NextResponse.json(arr);
  } catch (error) {
    console.error("Recommendation API Error:", error);

    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}
