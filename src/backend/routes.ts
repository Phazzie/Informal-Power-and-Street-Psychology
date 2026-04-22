import { Request, Response } from 'express';
import { AIService } from './aiService';
import { z } from 'zod';
import { APP_CONSTANTS } from '../core/config/constants';

// Uncle Bob Audit #3: Zod Prototype Pollution Prevention via .strict()
export const AnalyzeSchema = z.object({
  authorVoice: z.string()
    .min(10, "Author voice snippet is too short to analyze.")
    .max(APP_CONSTANTS.LIMITS.MAX_AUTHOR_VOICE_BYTES)
}).strict();

export const ChatSchema = z.object({
  authorVoice: z.string().min(1).max(APP_CONSTANTS.LIMITS.MAX_AUTHOR_VOICE_BYTES),
  projectName: z.string().min(1),
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),  // We map assistant to model on the frontend or backend
    parts: z.array(z.object({
      text: z.string()
    }).strict())
  }).strict()).optional().default([])
}).strict();

export class Routes {
  static async analyze(req: Request, res: Response) {
    try {
      const parsed = AnalyzeSchema.parse(req.body);
      const result = await AIService.analyzeMaterial(parsed.authorVoice);
      res.json(result);
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid Payload", details: e.format() });
        return;
      }
      console.error(e);
      res.status(500).json({ error: (e as Error).message || "Internal Server Error" });
    }
  }

  static async chat(req: Request, res: Response) {
    try {
      const parsed = ChatSchema.parse(req.body);
      
      const historyFormatted = parsed.history.map(h => ({
        role: h.role,
        parts: h.parts
      }));

      const chat = await AIService.createChatSession(parsed.projectName, parsed.authorVoice, historyFormatted);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      const result = await chat.sendMessageStream({ message: parsed.message });
      for await (const chunk of result) {
        res.write(chunk.text);
      }
      res.end();
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid Payload", details: e.format() });
        return;
      }
      console.error("Chat Stream error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: (e as Error).message || "Internal Server Error" });
      }
    }
  }
}
