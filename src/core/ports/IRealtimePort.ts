export interface LiveSessionCallbacks {
  onTranscription?: (text: string, role: 'user' | 'model') => void;
  onAudioData?: (data: string) => void;
  onInterrupted?: () => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

export interface IRealtimeSession {
  sendRealtimeInput(audio: { data: string; mimeType: string }): void;
  close(): void;
}

export interface IRealtimePort {
  /**
   * Start a realtime voice session with the LLM backend
   */
  startLiveSession(projectName: string, authorVoice: string, callbacks: LiveSessionCallbacks): IRealtimeSession;
}
