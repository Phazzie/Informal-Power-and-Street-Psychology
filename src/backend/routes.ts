import { Request, Response } from 'express';
import { AIService } from './aiService';
import { z } from 'zod';

const AnalyzeSchema = z.object({
  authorVoice: z.string().min(10, "Author voice snippet is too short to analyze.").max(200000)
});

const ChatSchema = z.object({
  authorVoice: z.string().min(1),
  projectName: z.string().min(1),
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'model']),
    parts: z.array(z.object({
      text: z.string()
    }))
  })).optional().default([])
});

export class Routes {
  static async analyze(req: Request, res: Response) {
    try {
      const parsed = AnalyzeSchema.parse(req.body);
      const result = await AIService.analyzeMaterial(parsed.authorVoice);
      res.json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid Payload", details: e.format() });
        return;
      }
      console.error(e);
      res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  }

  static async chat(req: Request, res: Response) {
    try {
      const parsed = ChatSchema.parse(req.body);
      const chat = await AIService.createChatSession(parsed.projectName, parsed.authorVoice, parsed.history);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      const result = await chat.sendMessageStream({ message: parsed.message });
      for await (const chunk of result) {
        res.write(chunk.text);
      }
      res.end();
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid Payload", details: e.format() });
        return;
      }
      console.error("Chat Stream error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message || "Internal Server Error" });
      }
    }
  }
}
