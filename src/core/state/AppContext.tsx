import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

type AppState = {
  selectedProjectId: string | null;
  isImporting: boolean;
  isVoiceOpen: boolean;
};

type AppAction = 
  | { type: 'SET_PROJECT'; payload: string | null }
  | { type: 'OPEN_IMPORT' }
  | { type: 'CLOSE_IMPORT' }
  | { type: 'OPEN_VOICE' }
  | { type: 'CLOSE_VOICE' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, selectedProjectId: action.payload };
    case 'OPEN_IMPORT':
      return { ...state, isImporting: true };
    case 'CLOSE_IMPORT':
      return { ...state, isImporting: false };
    case 'OPEN_VOICE':
      return { ...state, isVoiceOpen: true };
    case 'CLOSE_VOICE':
      return { ...state, isVoiceOpen: false };
    default:
      return state;
  }
}

const getInitialState = (): AppState => {
  if (typeof window === 'undefined') {
    return { selectedProjectId: null, isImporting: false, isVoiceOpen: false };
  }
  return {
    selectedProjectId: localStorage.getItem('subsurface_selected_project'),
    isImporting: false,
    isVoiceOpen: false,
  };
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    if (state.selectedProjectId) {
      localStorage.setItem('subsurface_selected_project', state.selectedProjectId);
    } else {
      localStorage.removeItem('subsurface_selected_project');
    }
  }, [state.selectedProjectId]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}
