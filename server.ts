import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { GoogleGenAI, Type, Modality } from '@google/genai';

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/analyze', async (req, res) => {
    try {
      const { authorVoice } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
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

      res.json(JSON.parse(response.text || '{}'));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { authorVoice, projectName, message, history } = req.body;
      const context = `Context: This is a project titled "${projectName}". 
The following is the primary material (author's voice) from the project:
---
${authorVoice.slice(0, 100000)}
---
You are the developmental editor. Help the author push on ideas, find patterns, or explore the thesis.`;

      const chat = ai.chats.create({
        model: "gemini-3.1-flash-preview",
        config: { systemInstruction: context },
        history: history
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      const result = await chat.sendMessageStream({ message });
      for await (const chunk of result) {
        res.write(chunk.text);
      }
      res.end();
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket for Live API
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', async (ws, req) => {
    let aiSession: any = null;

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'init') {
          const { authorVoice, projectName } = msg;
          const liveInstruction = `You are a developmental editor listening to the author's voice material for the project "${projectName}". 
Primary Material: ${authorVoice.slice(0, 50000)}
Engage in a voice-to-voice dialogue. Push on their patterns, identify subsurface emotional beats, and help them refine their thesis. 
Keep responses concise and focused on the material. Always prioritize the author's specificity.`;

          aiSession = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
              systemInstruction: liveInstruction,
            },
            callbacks: {
              onmessage: (m: any) => {
                const base64Audio = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                const modelText = m.serverContent?.modelTurn?.parts?.[0]?.text;
                const userText = m.serverContent?.userTurn?.parts?.[0]?.text;
                const interrupted = !!m.serverContent?.interrupted;
                
                ws.send(JSON.stringify({
                  audio: base64Audio,
                  modelText,
                  userText,
                  interrupted
                }));
              },
              onclose: () => ws.send(JSON.stringify({ closed: true })),
              onerror: (e) => console.error(e)
            }
          });
          ws.send(JSON.stringify({ status: 'connected' }));
        } else if (msg.type === 'audio' && aiSession) {
          aiSession.sendRealtimeInput({
            audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      } catch (e) {
        console.error("WS error:", e);
      }
    });

    ws.on('close', () => {
      if (aiSession) {
        try { aiSession.close(); } catch (e) {}
      }
    });
  });
}

startServer();
