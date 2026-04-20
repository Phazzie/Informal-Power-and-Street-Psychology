import { Request, Response } from 'express';
import { AIService } from './aiService';

export class Routes {
  static async analyze(req: Request, res: Response) {
    try {
      const { authorVoice } = req.body;
      if (!authorVoice) throw new Error("Missing authorVoice");
      const result = await AIService.analyzeMaterial(authorVoice);
      res.json(result);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }

  static async chat(req: Request, res: Response) {
    try {
      const { authorVoice, projectName, message, history } = req.body;
      if (!authorVoice || !message) throw new Error("Missing required fields");

      const chat = await AIService.createChatSession(projectName, authorVoice, history);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      const result = await chat.sendMessageStream({ message });
      for await (const chunk of result) {
        res.write(chunk.text);
      }
      res.end();
    } catch (e: any) {
      console.error(e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message });
      }
    }
  }
}
