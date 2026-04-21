import { WebSocketServer, WebSocket } from 'ws';
import { AIService } from './aiService';
import { consumeTicket } from './ticketCache';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', (ws: WebSocket, req) => {
    
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

    let aiSession: any = null;

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'init') {
          const { authorVoice, projectName } = msg;

          aiSession = await AIService.createLiveSession(projectName, authorVoice, {
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
            onerror: (e: any) => console.error("Live API Error:", e)
          });
          
          ws.send(JSON.stringify({ status: 'connected' }));
        } else if (msg.type === 'audio' && aiSession) {
          aiSession.sendRealtimeInput({
            audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      } catch (e) {
        console.error("WS message error:", e);
      }
    });

    ws.on('close', () => {
      if (aiSession) {
        try { aiSession.close(); } catch (e) {}
      }
    });
  });
}
