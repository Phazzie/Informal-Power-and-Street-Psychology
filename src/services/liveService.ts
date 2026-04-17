export interface LiveSessionCallbacks {
  onTranscription?: (text: string, role: 'user' | 'model') => void;
  onAudioData?: (data: string) => void;
  onInterrupted?: () => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

export function startLiveSession(projectName: string, authorVoice: string, callbacks: LiveSessionCallbacks) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/live`;
  const ws = new WebSocket(wsUrl);

  const session = {
    sendRealtimeInput: ({ audio }: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'audio', data: audio.data }));
      }
    },
    close: () => {
      ws.close();
    }
  };

  ws.onopen = () => {
    ws.send(JSON.stringify({
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

  return session;
}
