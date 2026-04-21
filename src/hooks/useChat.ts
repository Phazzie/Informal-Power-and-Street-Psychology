import { useReducer, useRef, useEffect, useCallback } from 'react';
import { Project, ConversationMessage } from '../types';
import { useDependencies } from '../core/di/DIContext';
import { toast } from 'react-toastify';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ChatState = {
  messages: ChatMessage[];
  input: string;
  status: 'idle' | 'typing';
};

type ChatAction = 
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SUBMIT_USER_MESSAGE'; payload: string }
  | { type: 'INITIATE_STREAM' }
  | { type: 'APPEND_CHUNK'; payload: string }
  | { type: 'STREAM_COMPLETE' }
  | { type: 'STREAM_ERROR'; payload: string }
  | { type: 'ABORT_STREAM' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_INPUT':
      if (state.status === 'typing') return state; // Guard
      return { ...state, input: action.payload };
      
    case 'SUBMIT_USER_MESSAGE':
      if (state.status === 'typing' || !action.payload.trim()) return state;
      return {
        ...state,
        input: '',
        status: 'typing',
        messages: [...state.messages, { role: 'user', content: action.payload }]
      };
      
    case 'INITIATE_STREAM':
      return {
        ...state,
        messages: [...state.messages, { role: 'assistant', content: '' }]
      };
      
    case 'APPEND_CHUNK': {
      const messages = [...state.messages];
      const lastIdx = messages.length - 1;
      messages[lastIdx] = { ...messages[lastIdx], content: messages[lastIdx].content + action.payload };
      return { ...state, messages };
    }
      
    case 'STREAM_COMPLETE':
      return { ...state, status: 'idle' };
      
    case 'STREAM_ERROR':
      return {
        ...state,
        status: 'idle',
        messages: [...state.messages, { role: 'assistant', content: action.payload }]
      };

    case 'ABORT_STREAM':
      return {
        ...state,
        status: 'idle',
        messages: [...state.messages, { role: 'assistant', content: '\n\n[Interaction Aborted]' }]
      };
      
    default:
      return state;
  }
}

export function useChat(project: Project | null) {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    input: '',
    status: 'idle'
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { llm } = useDependencies();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.status]);

  // Clean up abort controller un unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const setInput = useCallback((val: string) => dispatch({ type: 'SET_INPUT', payload: val }), []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!state.input.trim() || !project || state.status === 'typing') return;

    const userInput = state.input;
    dispatch({ type: 'SUBMIT_USER_MESSAGE', payload: userInput });

    try {
      const history: ConversationMessage[] = state.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { exportAuthorVoice } = await import('../utils/parser');
      const authorVoice = exportAuthorVoice(project);

      abortControllerRef.current = new AbortController();
      dispatch({ type: 'INITIATE_STREAM' });

      const stream = llm.streamChat(
        project.name, 
        authorVoice, 
        history, 
        userInput, 
        { signal: abortControllerRef.current.signal }
      );
      
      for await (const chunk of stream) {
        dispatch({ type: 'APPEND_CHUNK', payload: chunk });
      }
      dispatch({ type: 'STREAM_COMPLETE' });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        dispatch({ type: 'ABORT_STREAM' });
      } else {
        console.error("Chat error", error);
        toast.error(`Engine Desync: ${error.message || 'Stream Terminated'}`);
        dispatch({ type: 'STREAM_ERROR', payload: 'Connection lost. The core is re-calibrating.' });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  return {
    messages: state.messages,
    input: state.input,
    setInput,
    isTyping: state.status === 'typing',
    scrollRef,
    handleSubmit
  };
}
