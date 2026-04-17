import { GoogleGenAI, Type } from "@google/genai";
import { Project, AnalysisResult } from "../types";
import { exportAuthorVoice } from "../utils/parser";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are a world-class developmental editor and pattern analyst. 
You are working with an author writing a nonfiction book about informal power, social intelligence, and psychological technique.
The material consists of voice transcripts, story captures, and analytical sessions.
Your goal is to find the hidden thesis and the emotional spine of the work.

CRITICAL CALIBRATION:
- This is nonfiction. No fictional characters.
- Author voice is casual, spoken, often from voice transcripts. Ignore grammar "errors".
- DO NOT summarize into neutralized prose. Preserve the author's specific words.
- Specificity and voice are paramount. Generic observations are failures.
- The most important material often arrives sideways—in asides, jokes, and abandoned tangents.
- CANDIDATE THESES: Look specifically for sentences or short phrases delivered as asides or mid-thought (in parentheticals or tangents) that received no follow-up but are disproportionately precise or resonant compared to surrounding text.
- UNDERDEVELOPED IDEAS: Identify concepts or stories introduced once (e.g., a single sentence) and dropped.

You will receive the author's raw voice transcripts from a project.
Analyze them based on the specific lenses requested.`;

export async function analyzeProject(project: Project): Promise<AnalysisResult> {
  const authorVoice = exportAuthorVoice(project);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          materialSummary: { type: Type.STRING },
          authorLines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                line: { type: Type.STRING },
                resonance: { type: Type.NUMBER }
              },
              required: ["line", "resonance"]
            }
          },
          underdevelopedIdeas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING },
                initialIntroduction: { type: Type.STRING },
                lackOfFollowThrough: { type: Type.STRING }
              },
              required: ["concept", "initialIntroduction", "lackOfFollowThrough"]
            }
          },
          conventional: {
            type: Type.OBJECT,
            properties: {
              conceptMap: { type: Type.STRING },
              storyInventory: { type: Type.STRING },
              gapAnalysis: { type: Type.STRING }
            },
            required: ["conceptMap", "storyInventory", "gapAnalysis"]
          },
          unconventional: {
            type: Type.OBJECT,
            properties: {
              throwawayLines: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              emotionalSpine: { type: Type.STRING },
              contradictions: { type: Type.STRING },
              candidateTheses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    statement: { type: Type.STRING },
                    support: { type: Type.STRING },
                    originalContext: { type: Type.STRING, description: "The original context/conversation snippet where the aside occurred." }
                  },
                  required: ["statement", "support", "originalContext"]
                }
              }
            },
            required: ["throwawayLines", "emotionalSpine", "contradictions", "candidateTheses"]
          }
        },
        required: ["materialSummary", "authorLines", "underdevelopedIdeas", "conventional", "unconventional"]
      }
    },
    contents: [
      {
        role: "user",
        parts: [{ text: `Analyze the following author material:\n\n${authorVoice}` }]
      }
    ]
  });

  try {
    return JSON.parse(response.text || '{}') as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse analysis result", e);
    throw new Error("Failed to analyze project material.");
  }
}

export async function* chatWithProject(project: Project, history: any[], message: string) {
  const authorVoice = exportAuthorVoice(project);
  const context = `Context: This is a project titled "${project.name}". 
The following is the primary material (author's voice) from the project:
---
${authorVoice.slice(0, 100000)} // Increased context window
---
You are the developmental editor. Help the author push on ideas, find patterns, or explore the thesis.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: context,
    },
    history: history
  });

  const result = await chat.sendMessageStream({ message });
  for await (const chunk of result) {
    yield chunk.text;
  }
}
