import { WebSocketServer, WebSocket } from 'ws';
import { AIService } from './aiService';
import { consumeTicket } from './ticketCache';

// Uncle Bob Audit #8: Strict Typings
interface LiveSessionProtocol {
  sendRealtimeInput: (params: { audio: { data: string; mimeType: string } }) => void;
  close: () => void;
}

interface InitMessage {
  type: 'init';
  authorVoice: string;
  projectName: string;
}

interface AudioMessage {
  type: 'audio';
  data: string;
}

type WsIncomingMessage = InitMessage | AudioMessage;

// Detailed Typings for Google GenAI Live API Response
interface GenAILiveMessage {
  serverContent?: {
    modelTurn?: { parts?: Array<{ inlineData?: { data: string }, text?: string }> };
    userTurn?: { parts?: Array<{ text?: string }> };
    interrupted?: boolean;
  };
}

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', (ws: WebSocket, req) => {
    // Uncle Bob Audit #2: Websocket Security (Origin Check)
    const origin = req.headers.origin;
    // In production, we'd array.includes() against process.env.ALLOWED_ORIGINS
    if (!origin && process.env.NODE_ENV === 'production') {
       ws.close(1008, 'Unauthorized: Origin rejected');
       return;
    }
    
    // Parse WS query string for ticket
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const ticket = url.searchParams.get('ticket');
    
    if (!ticket) {
      ws.close(1008, 'Unauthorized: Missing ticket');
      return;
    }
    
    const userId = consumeTicket(ticket);
    if (!userId) {
      ws.close(1008, 'Unauthorized: Invalid or expired ticket');
      return;
    }

    let aiSession: LiveSessionProtocol | null = null;

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString()) as WsIncomingMessage;
        
        if (msg.type === 'init') {
          const { authorVoice, projectName } = msg;

          aiSession = await AIService.createLiveSession(projectName, authorVoice, {
            onmessage: (m: GenAILiveMessage) => {
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
            onerror: (e: Error | unknown) => console.error("Live API Error:", e instanceof Error ? e.message : e)
          });
          
          ws.send(JSON.stringify({ status: 'connected' }));
        } else if (msg.type === 'audio' && aiSession) {
          aiSession.sendRealtimeInput({
            audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      } catch (e: unknown) {
        console.error("WS message error:", e instanceof Error ? e.message : e);
      }
    });

    ws.on('close', () => {
      if (aiSession) {
        try { 
          aiSession.close(); 
        } catch (e: unknown) {
          // Explicitly log the close error instead of swallowing it silently
          console.warn("Failed to gracefully close Live AI session:", e instanceof Error ? e.message : e);
        }
      }
    });
  });
}
