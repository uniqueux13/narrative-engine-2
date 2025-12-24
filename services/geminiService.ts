import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real environment, never expose API keys on the client.
// This should be proxied through a backend. 
// For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateScriptForSlot = async (
  slotName: string,
  slotDescription: string,
  projectContext: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Gemini API Key is missing. Please check your configuration.";
  }

  try {
    const modelId = "gemini-3-flash-preview"; 
    
    const prompt = `
      You are a specialized scriptwriter for short-form viral videos.
      
      Project Context: ${projectContext}
      Current Slot Name: ${slotName}
      Current Slot Goal: ${slotDescription}
      
      Task: Write a concise, engaging script (max 2 sentences) or a specific direction for action for this specific slot.
      Keep it punchy. Do not include scene headers. Just the spoken line or action.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Could not generate script.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the Narrative Engine's AI core.";
  }
};
