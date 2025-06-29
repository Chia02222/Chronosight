import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Coordinates, HistoricalContext, EraData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("CRITICAL: API_KEY environment variable is not set. ChronoSight will not function.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! }); 

const TEXT_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
// Use the new image generation model as requested.
const IMAGE_MODEL_NAME = "gemini-2.0-flash-preview-image-generation";

function parseJsonFromText(text: string): any {
  if (typeof text !== 'string' || !text.trim()) {
    console.error("AI response text is empty or not a string:", text);
    throw new Error("AI response was empty or not in the expected format.");
  }

  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e: any) {
    console.error("Failed to parse JSON response from AI. Raw text:", text, "Processed string for parsing:", jsonStr, "Error:", e);
    throw new Error(`Invalid JSON response from AI: ${e.message}. Ensure the AI is strictly returning JSON.`);
  }
}


export async function fetchHistoricalContext(coords: Coordinates, name?: string): Promise<HistoricalContext> {
  if (!API_KEY) {
    throw new Error("API Key not configured. Cannot fetch historical context.");
  }

  const locationIdentifier = (coords.lat === 0 && coords.lng === 0 && name) ? name : `latitude ${coords.lat}, longitude ${coords.lng}`;

  const systemInstruction = `You are ChronoSight, an AI historian and visualizer. Your primary function is to provide structured historical context and image generation prompts for a given geographical location.
You MUST respond ONLY with a single, valid JSON object. Do NOT include any explanatory text, conversational filler, or markdown formatting (like \`\`\`json) outside of the JSON structure itself.
The JSON object must strictly adhere to the following schema:
{
  "historicalNarrative": "string (250-450 words)",
  "suggestedEras": [
    {
      "eraName": "string (e.g., 'Victorian Era, circa 1880')",
      "historicalImagePrompt": "string (detailed prompt, 60-120 words)",
      "keyImageInsights": ["string (fact 1, max 25 words)", "string (fact 2, max 25 words)"]
    }
  ],
  "modernImagePrompt": "string (detailed prompt, 60-120 words)",
  "resolvedCoordinates"?: { "lat": number, "lng": number }
}`;

  const userPrompt = `
For the location identified as "${locationIdentifier}":

1.  \`resolvedCoordinates\`: If the original input \`"${locationIdentifier}"\` was primarily a name or address (and not precise coordinates like "latitude X, longitude Y"), provide the best-estimated geographic coordinates (latitude and longitude) for this location as \`resolvedCoordinates: { "lat": number, "lng": number }\`. If the input \`"${locationIdentifier}"\` already specified precise coordinates, you should populate \`resolvedCoordinates\` with these same input coordinates. If unable to determine coordinates for a named location, you may omit the \`resolvedCoordinates\` field or set its value to null.

2.  Generate a \`historicalNarrative\`: A concise narrative (250-450 words) about this specific location. Focus on key historical events, architectural evolution (if applicable), and significant social or cultural shifts. If the location is generic (e.g., open ocean, remote desert), describe general historical activities (maritime, nomadic) or geological/natural history relevant to such an area over time.

3.  Identify \`suggestedEras\`: An array of 2 to 3 unique and historically significant eras relevant to the location. These should be visually distinct periods. Examples: "Victorian Era, circa 1880", "Roman Settlement, AD 150", "Art Deco Period, 1930s", "Prehistoric Times".
    For each era in \`suggestedEras\`, provide an object containing:
    a.  \`eraName\`: The name of the era (must match one of the suggested era names).
    b.  \`historicalImagePrompt\`: A detailed text prompt (60-120 words) for an AI image generation model. This prompt should aim to visualize how THE EXACT SPOT of the given location might have looked during this \`eraName\`. Include details on plausible architecture, structures, common activities, modes of transport (if any), typical attire if people are depicted, vegetation, landscape features, overall atmosphere, and potential time of day. Focus on historical plausibility and visual richness. For natural or uninhabited scenes, emphasize flora, fauna, geology, and atmospheric conditions of that era.
    c.  \`keyImageInsights\`: An array of 2-3 brief, interesting facts (max 25 words each). Each fact should relate to visual elements or historical context typical of that \`eraName\` for the location, which could be highlighted in the generated image.

4.  Generate a \`modernImagePrompt\`: A detailed text prompt (60-120 words) for an AI image generation model to create a photorealistic, modern-day street-level or landscape view of THE EXACT SPOT. It should describe current architecture, environment, and typical elements as it would appear today. If it's a natural area, describe its current state (e.g., preserved forest, modern park, current geological state).

Ensure all text prompts (\`historicalImagePrompt\`, \`modernImagePrompt\`) are descriptive and will lead to compelling, distinct, and historically plausible images for the specified location and era.
If the location is very generic (e.g., middle of the ocean), adapt prompts to show relevant scenes (e.g., a historical sailing ship from a plausible era, a modern research vessel, or natural phenomena).
Adhere strictly to the JSON output format specified in the system instruction.
`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: TEXT_MODEL_NAME,
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
        }
    });
    
    const parsedJson = parseJsonFromText(response.text);

    if (!parsedJson || typeof parsedJson !== 'object') {
        throw new Error("AI response was not a valid JSON object after parsing.");
    }
    if (typeof parsedJson.historicalNarrative !== 'string' || parsedJson.historicalNarrative.length === 0) {
        throw new Error("AI response missing 'historicalNarrative' or it's empty.");
    }
    if (!Array.isArray(parsedJson.suggestedEras) || parsedJson.suggestedEras.length === 0) {
        throw new Error("AI response missing 'suggestedEras' array or it's empty.");
    }
    for (const era of parsedJson.suggestedEras) {
        if (!era || typeof era !== 'object' ||
            typeof era.eraName !== 'string' || era.eraName.length === 0 ||
            typeof era.historicalImagePrompt !== 'string' || era.historicalImagePrompt.length === 0 ||
            !Array.isArray(era.keyImageInsights) || era.keyImageInsights.length === 0 ||
            !era.keyImageInsights.every((insight: any) => typeof insight === 'string' && insight.length > 0)) {
            console.error("Invalid era object in suggestedEras:", era);
            throw new Error("AI response 'suggestedEras' contains invalid era data. Check eraName, historicalImagePrompt, and keyImageInsights.");
        }
    }
    if (typeof parsedJson.modernImagePrompt !== 'string' || parsedJson.modernImagePrompt.length === 0) {
        throw new Error("AI response missing 'modernImagePrompt' or it's empty.");
    }
    // Validate optional resolvedCoordinates
    if (parsedJson.resolvedCoordinates !== undefined && parsedJson.resolvedCoordinates !== null) {
      if (typeof parsedJson.resolvedCoordinates !== 'object' ||
          typeof parsedJson.resolvedCoordinates.lat !== 'number' ||
          typeof parsedJson.resolvedCoordinates.lng !== 'number') {
          console.warn("AI response 'resolvedCoordinates' is present but invalid. Ignoring.", parsedJson.resolvedCoordinates);
          // Set to null or delete if invalid, so App.tsx doesn't use faulty data
          parsedJson.resolvedCoordinates = null; 
      }
    }
    
    return parsedJson as HistoricalContext;

  } catch (error: any) {
    console.error("Error fetching historical context from Gemini:", error);
    if (error.message.startsWith("Invalid JSON response from AI") || error.message.includes("AI response missing") || error.message.includes("invalid era data")) {
        throw new Error(`The AI provided data in an unexpected format. Details: ${error.message}`);
    }
    throw new Error(`Gemini API Error (Text Generation): Failed to get historical context. ${error.message}`);
  }
}

export async function generateImageApi(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("API Key not configured. Cannot generate image.");
  }
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.error("Image generation prompt is empty or invalid:", prompt);
    throw new Error("Image generation prompt is missing or invalid.");
  }

  try {
    const responseStream = await ai.models.generateContentStream({
        model: IMAGE_MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            // As per user-provided example for this model.
            // These properties may not be in the standard GenerateContentConfig type,
            // but are passed to the API. Using 'as any' to avoid TS errors.
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'text/plain',
        } as any,
    });

    for await (const chunk of responseStream) {
        const part = chunk.candidates?.[0]?.content?.parts?.[0];
        
        if (part?.inlineData) {
            const { mimeType, data } = part.inlineData;
            if (data && mimeType) {
                return `data:${mimeType};base64,${data}`;
            }
        }
    }

    throw new Error("AI image generation failed. The model did not return any image data in the stream.");

  } catch (error: any) {
    console.error("Error generating image from Gemini:", error);
    if (error.message && (error.message.includes("NOT_FOUND") || error.message.includes("not found"))) {
      throw new Error(`Gemini API Error: The model '${IMAGE_MODEL_NAME}' was not found. The model name may be incorrect or you may not have access.`);
    }
    throw new Error(`Gemini API Error (Image Generation): ${error.message}`);
  }
}