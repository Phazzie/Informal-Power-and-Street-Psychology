import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface LiveSessionCallbacks {
  onTranscription?: (text: string, role: 'user' | 'model') => void;
  onAudioData?: (data: string) => void;
  onInterrupted?: () => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

export function startLiveSession(systemInstruction: string, callbacks: LiveSessionCallbacks) {
  const sessionPromise = ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    callbacks: {
      onopen: () => {
        console.log("Live session opened");
      },
      onmessage: async (message) => {
        // Handle audio output
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          callbacks.onAudioData?.(base64Audio);
        }

        // Handle transcription
        const modelTranscript = message.serverContent?.modelTurn?.parts?.[0]?.text;
        if (modelTranscript) {
          callbacks.onTranscription?.(modelTranscript, 'model');
        }

        // Handle user transcription if configured
        // (The skill says message.serverContent?.inputAudioTranscription)
        // Adjusting based on common schema
        const userTranscript = (message as any).serverContent?.userTurn?.parts?.[0]?.text;
        if (userTranscript) {
           callbacks.onTranscription?.(userTranscript, 'user');
        }

        if (message.serverContent?.interrupted) {
          callbacks.onInterrupted?.();
        }
      },
      onclose: () => {
        callbacks.onClose?.();
      },
      onerror: (error) => {
        callbacks.onError?.(error);
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction,
    },
  });

  return sessionPromise;
}
