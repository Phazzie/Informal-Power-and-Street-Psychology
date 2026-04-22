import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './core/state/AppContext';
import { DIProvider, IDependencyContainer } from './core/di/DIContext';
import { FirebaseStorageAdapter } from './adapters/FirebaseStorageAdapter';
import { HttpLLMAdapter } from './adapters/HttpLLMAdapter';
import { BrowserMediaAdapter } from './adapters/BrowserMediaAdapter';
import { SystemTimeAdapter } from './adapters/SystemTimeAdapter';
import { WebsocketRealtimeAdapter } from './adapters/WebsocketRealtimeAdapter';
import { FirebaseAuthAdapter } from './adapters/FirebaseAuthAdapter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const authAdapter = new FirebaseAuthAdapter();

// Audit #5.2: Graceful Degradation if AudioContext hardware is missing/blocked
let mediaAdapter: IDependencyContainer['media'];
try {
  mediaAdapter = new BrowserMediaAdapter();
} catch (error) {
  console.warn("Hardware audio missing or blocked. The Live feature will degrade off.", error);
  // Null Object Pattern for degraded audio context
  mediaAdapter = {
    requestMicrophone: async () => { throw new Error('Audio hardware not available'); },
    releaseStream: () => {}
  };
}

const productionContainer: IDependencyContainer = {
  storage: new FirebaseStorageAdapter(),
  llm: new HttpLLMAdapter(authAdapter),
  media: mediaAdapter,
  time: new SystemTimeAdapter(),
  realtime: new WebsocketRealtimeAdapter(authAdapter),
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DIProvider container={productionContainer}>
        <AppProvider>
          <App />
          <ToastContainer theme="dark" position="bottom-right" />
        </AppProvider>
      </DIProvider>
    </ErrorBoundary>
  </StrictMode>,
);
