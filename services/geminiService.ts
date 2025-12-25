
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FrameData, VideoAnalysisResult, Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeVideoFrames = async (frames: FrameData[], language: Language): Promise<VideoAnalysisResult> => {
  const ai = getAI();
  
  const frameParts = frames.slice(0, 10).map(frame => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: frame.dataUrl.split(',')[1]
    }
  }));

  const languagePrompt = language === 'fr' ? 'French' : 'English';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          ...frameParts,
          { text: `You are a professional YouTube growth expert. Based on these frames from a video, analyze the content and provide a viral growth package IN ${languagePrompt}. Include 5 high-CTR titles, a compelling SEO-optimized description, 15 relevant tags, a brief engagement strategy, and 3 specific visual prompts for an AI image generator to create a stunning thumbnail for this content. All text output must be in ${languagePrompt}.` }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          viralTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          engagementStrategy: { type: Type.STRING },
          thumbnailPrompts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["viralTitles", "description", "tags", "engagementStrategy", "thumbnailPrompts"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as VideoAnalysisResult;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to analyze video content");
  }
};

export const generateAIThumbnail = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Create a professional, high-quality, eye-catching YouTube thumbnail background. It should be cinematic and vibrant. Context: ${prompt}` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  let imageUrl = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("No image generated");
  return imageUrl;
};
