import { IRealtimePort, IRealtimeSession, LiveSessionCallbacks } from '../core/ports/IRealtimePort';
import { getAuth } from 'firebase/auth';

export class WebsocketRealtimeAdapter implements IRealtimePort {
  
  startLiveSession(projectName: string, authorVoice: string, callbacks: LiveSessionCallbacks): IRealtimeSession {
    let ws: WebSocket | null = null;
    let isClosed = false;

    const session: IRealtimeSession = {
      sendRealtimeInput: ({ data, mimeType }) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'audio', data }));
        }
      },
      close: () => {
        isClosed = true;
        if (ws) {
          ws.close();
        }
      }
    };

    const initialize = async () => {
      try {
        const auth = getAuth();
        if (!auth.currentUser) {
          throw new Error("Unauthorized: Please sign in.");
        }
        
        const token = await auth.currentUser.getIdToken();
        const ticketRes = await fetch('/api/live/ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!ticketRes.ok) {
          throw new Error('Failed to obtain WebSocket ticket.');
        }

        const { ticket } = await ticketRes.json();
        
        if (isClosed) return; // Closed before ticket was fetched

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live?ticket=${ticket}`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws!.send(JSON.stringify({
            type: 'init',
            projectName,
            authorVoice
          }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.audio) callbacks.onAudioData?.(msg.audio);
            if (msg.modelText) callbacks.onTranscription?.(msg.modelText, 'model');
            if (msg.userText) callbacks.onTranscription?.(msg.userText, 'user');
            if (msg.interrupted) callbacks.onInterrupted?.();
            if (msg.closed) callbacks.onClose?.();
          } catch (e) {}
        };

        ws.onclose = () => {
          callbacks.onClose?.();
        };

        ws.onerror = (e) => {
          callbacks.onError?.(e);
        };
      } catch (err: any) {
        if (!isClosed) {
          callbacks.onError?.(err);
          callbacks.onClose?.();
        }
      }
    };

    initialize();

    return session;
  }
}
