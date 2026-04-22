import { IRealtimePort, IRealtimeSession, LiveSessionCallbacks } from '../core/ports/IRealtimePort';
import { IAuthPort } from '../core/ports/IAuthPort';
import { APP_CONSTANTS } from '../core/config/constants';

export class WebsocketRealtimeAdapter implements IRealtimePort {
  constructor(private authPort: IAuthPort) {}

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
        const token = await this.authPort.getSessionToken();
        if (!token) {
          throw new Error("Unauthorized: Please sign in.");
        }
        
        const ticketRes = await fetch(APP_CONSTANTS.API_ROUTES.LIVE_TICKET, {
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
        const wsUrl = `${protocol}//${window.location.host}${APP_CONSTANTS.API_ROUTES.LIVE_WS}?ticket=${ticket}`;
        
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
            if (msg.modelText) callbacks.onTranscription?.(msg.modelText, APP_CONSTANTS.ROLES.MODEL);
            if (msg.userText) callbacks.onTranscription?.(msg.userText, APP_CONSTANTS.ROLES.USER);
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
