import { GoogleGenAI, Type } from "@google/genai";
import { FractalConfig } from "../types";

export const generateFractalConfig = async (userPrompt: string): Promise<Partial<FractalConfig>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
    You are a 3D Geometry Expert and Fractal Artist. 
    Your goal is to generate an Iterated Function System (IFS) configuration based on a user's description.
    
    The fractal is built by starting with a base shape (like a cube) and replacing it recursively with a set of smaller versions of itself defined by 'rules'.
    
    Each 'rule' defines the position, rotation (in radians), and uniform scale of a child element relative to its parent (which is considered to be size 1 at 0,0,0).
    
    Constraints:
    - Keep the number of rules between 2 and 12 to maintain performance.
    - Scale should usually be less than 1 (e.g., 0.3 to 0.8) to ensure convergence, unless creating expanding structures.
    - Positions are usually within range -1 to 1 for standard bounding boxes.
    - Colors should be hex strings.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a fractal configuration for: ${userPrompt}`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          baseShape: { type: Type.STRING, enum: ['box', 'sphere', 'pyramid'] },
          color: { type: Type.STRING },
          rules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                scale: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ['name', 'rules', 'baseShape', 'color']
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  try {
    const data = JSON.parse(response.text);
    // Ensure data conforms to our internal types (specifically tuples for arrays)
    return {
      ...data,
      rules: data.rules.map((r: any) => ({
        position: [r.position[0] || 0, r.position[1] || 0, r.position[2] || 0],
        rotation: [r.rotation[0] || 0, r.rotation[1] || 0, r.rotation[2] || 0],
        scale: r.scale || 0.5
      }))
    };
  } catch (e) {
    console.error("Failed to parse fractal config", e);
    throw new Error("Failed to parse AI response");
  }
};
