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

// Uncle Bob Audit #9: DRY. Extract Magic String
const LOCAL_STORAGE_KEY = 'subsurface_selected_project';

const getInitialState = (): AppState => {
  if (typeof window === 'undefined') {
    return { selectedProjectId: null, isImporting: false, isVoiceOpen: false };
  }
  return {
    selectedProjectId: localStorage.getItem(LOCAL_STORAGE_KEY),
    isImporting: false,
    isVoiceOpen: false,
  };
};

// Uncle Bob Audit #7: Split Context to prevent Re-render Avalanche
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    if (state.selectedProjectId) {
      localStorage.setItem(LOCAL_STORAGE_KEY, state.selectedProjectId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [state.selectedProjectId]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) throw new Error('useAppDispatch must be used within AppProvider');
  return context;
}
