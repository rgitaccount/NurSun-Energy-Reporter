
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SolarEstimationResult {
  monthlyData: { month: string; energy: number }[];
  totalAnnual: number;
}

export const estimatePvPerformanceWithGemini = async (params: {
  lat: number;
  lon: number;
  systemSize: number;
  slope: number;
  azimuth: number;
  loss: number;
}): Promise<SolarEstimationResult> => {
  const prompt = `
    You are a solar energy systems expert. 
    Estimate the monthly energy production (kWh) for a typical year for a PV system with the following specs:
    - Location: Latitude ${params.lat}, Longitude ${params.lon}
    - System Capacity: ${params.systemSize} kWp
    - Panel Slope: ${params.slope}°
    - Azimuth: ${params.azimuth}° (0 is South, -90 East, 90 West)
    - Estimated System Losses: ${params.loss}%
    
    Provide a realistic estimate based on historical solar irradiance for this specific geographic location.
    Return the data as a JSON object containing "monthlyData" (array of {month: string, energy: number}) and "totalAnnual" (number).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          monthlyData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                energy: { type: Type.NUMBER }
              },
              required: ["month", "energy"]
            }
          },
          totalAnnual: { type: Type.NUMBER }
        },
        required: ["monthlyData", "totalAnnual"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result as SolarEstimationResult;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error("Simulation engine failed to generate data.");
  }
};
