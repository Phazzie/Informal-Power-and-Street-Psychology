import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-bg-deep font-sans">
          <div className="max-w-md w-full p-8 border border-red-500/30 bg-red-500/5 rounded-xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-50 mb-2">Fatal System Error</h2>
              <p className="text-sm text-red-200/70">
                The application encountered an irrecoverable crash. 
              </p>
            </div>
            <div className="bg-black/40 p-4 rounded text-left text-xs text-red-300 font-mono w-full overflow-auto">
              {this.state.error?.message}
            </div>
            <button 
              className="mt-6 bg-red-500/20 text-red-100 hover:bg-red-500/30 px-6 py-2 rounded text-sm tracking-widest uppercase font-bold transition-all border border-red-500/30"
              onClick={() => window.location.reload()}
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
