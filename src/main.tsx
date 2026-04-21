import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './core/state/AppContext';
import { DIProvider } from './core/di/DIContext';
import { FirebaseStorageAdapter } from './adapters/FirebaseStorageAdapter';
import { HttpLLMAdapter } from './adapters/HttpLLMAdapter';
import { BrowserMediaAdapter } from './adapters/BrowserMediaAdapter';
import { SystemTimeAdapter } from './adapters/SystemTimeAdapter';
import { WebsocketRealtimeAdapter } from './adapters/WebsocketRealtimeAdapter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const productionContainer = {
  storage: new FirebaseStorageAdapter(),
  llm: new HttpLLMAdapter(),
  media: new BrowserMediaAdapter(),
  time: new SystemTimeAdapter(),
  realtime: new WebsocketRealtimeAdapter(),
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
