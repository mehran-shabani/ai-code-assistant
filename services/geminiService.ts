import { GoogleGenAI } from "@google/genai";
import type { GroundingSource } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerateResponseParams {
  prompt: string;
  isThinkingMode: boolean;
  isSearchGrounded: boolean;
  fileContext?: string;
}

interface GenerateResponseResult {
  text: string;
  sources?: GroundingSource[];
}

export const generateResponse = async ({ prompt, isThinkingMode, isSearchGrounded, fileContext }: GenerateResponseParams): Promise<GenerateResponseResult> => {
  try {
    let modelName: string;
    let config: any = {};
    
    const fullPrompt = fileContext
      ? `${fileContext}\n\n---\n\nBased on the file content provided, please answer the following question:\n\n${prompt}`
      : prompt;

    if (isThinkingMode) {
      modelName = 'gemini-2.5-pro';
      config.thinkingConfig = { thinkingBudget: 32768 };
      console.log(`Using model: ${modelName} with max thinking budget.`);
    } else if (isSearchGrounded) {
      modelName = 'gemini-2.5-flash';
      config.tools = [{ googleSearch: {} }];
      console.log(`Using model: ${modelName} with Google Search grounding.`);
    } else {
      modelName = 'gemini-2.5-flash';
      console.log(`Using default model: ${modelName}.`);
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config,
    });
    
    const text = response.text;
    
    let sources: GroundingSource[] = [];
    if (isSearchGrounded && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      sources = response.candidates[0].groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          uri: chunk.web.uri,
          title: chunk.web.title,
        }));
    }

    return { text, sources };

  } catch (error) {
    console.error("Error generating response from Gemini API:", error);
    // Re-throw the error to be handled by the calling component, allowing for more specific UI feedback.
    throw error;
  }
};