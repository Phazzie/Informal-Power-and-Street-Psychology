import React, { createContext, useContext, ReactNode } from 'react';
import { IStoragePort } from '../ports/IStoragePort';
import { ILLMPort } from '../ports/ILLMPort';
import { IMediaPort } from '../ports/IMediaPort';
import { ITimePort } from '../ports/ITimePort';
import { IRealtimePort } from '../ports/IRealtimePort';

export interface IDependencyContainer {
  storage: IStoragePort;
  llm: ILLMPort;
  media: IMediaPort;
  time: ITimePort;
  realtime: IRealtimePort;
}

export const DIContext = createContext<IDependencyContainer | null>(null);

interface DIProviderProps {
  container: IDependencyContainer;
  children: ReactNode;
}

export const DIProvider: React.FC<DIProviderProps> = ({ container, children }) => {
  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  );
};

export function useDependencies(): IDependencyContainer {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error("useDependencies must be used within a DIProvider. The DI Container was not injected.");
  }
  return context;
}
