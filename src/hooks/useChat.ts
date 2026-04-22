import { useReducer, useRef, useEffect, useCallback } from 'react';
import { Project, ConversationMessage } from '../types';
import { useDependencies } from '../core/di/DIContext';
import { toast } from 'react-toastify';
import { ProjectEntity } from '../domain/ProjectEntity';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string; // Audit #10: Explicit ID for appending chunks safely
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
  | { type: 'SUBMIT_USER_MESSAGE'; payload: ChatMessage }
  | { type: 'INITIATE_STREAM'; payload: { id: string } }
  | { type: 'APPEND_CHUNK'; payload: { id: string, chunk: string } }
  | { type: 'STREAM_COMPLETE' }
  | { type: 'STREAM_ERROR'; payload: { id: string, error: string } }
  | { type: 'ABORT_STREAM'; payload: { id: string } };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_INPUT':
      if (state.status === 'typing') return state; // Guard
      return { ...state, input: action.payload };
      
    case 'SUBMIT_USER_MESSAGE':
      if (state.status === 'typing' || !action.payload.content.trim()) return state;
      return {
        ...state,
        input: '',
        status: 'typing',
        messages: [...state.messages, action.payload]
      };
      
    case 'INITIATE_STREAM':
      return {
        ...state,
        messages: [...state.messages, { id: action.payload.id, role: 'assistant', content: '' }]
      };
      
    case 'APPEND_CHUNK': {
      // Uncle Bob Audit #10: Find exact message by ID, no guessing array lengths
      const messages = state.messages.map(m => 
        m.id === action.payload.id ? { ...m, content: m.content + action.payload.chunk } : m
      );
      return { ...state, messages };
    }
      
    case 'STREAM_COMPLETE':
      return { ...state, status: 'idle' };
      
    case 'STREAM_ERROR':
      return {
        ...state,
        status: 'idle',
        messages: state.messages.map(m => 
          m.id === action.payload.id ? { ...m, content: m.content + action.payload.error } : m
        )
      };

    case 'ABORT_STREAM':
      return {
        ...state,
        status: 'idle',
        messages: state.messages.map(m => 
          m.id === action.payload.id ? { ...m, content: m.content + '\n\n[Interaction Aborted]' } : m
        )
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
  
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { llm, storage } = useDependencies();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.status]);

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
    if (!state.input.trim() || !project || state.status === 'typing' || !user) return;

    const userInput = state.input;
    const userMsgId = Date.now().toString();
    dispatch({ type: 'SUBMIT_USER_MESSAGE', payload: { id: userMsgId, role: 'user', content: userInput } });

    const assistantMsgId = (Date.now() + 1).toString();

    try {
      const history: ConversationMessage[] = state.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Uncle Bob Audit #5.1: Domain Logic Encapsulation
      const entity = project instanceof ProjectEntity ? project.clone() : ProjectEntity.fromDTO(project);
      const authorVoice = entity.getAuthorVoiceBlob();

      abortControllerRef.current = new AbortController();
      dispatch({ type: 'INITIATE_STREAM', payload: { id: assistantMsgId } });

      const stream = llm.streamChat(
        project.name, 
        authorVoice, 
        history, 
        userInput, 
        { signal: abortControllerRef.current.signal }
      );
      
      let finalAssistantContent = '';
      for await (const chunk of stream) {
        finalAssistantContent += chunk;
        dispatch({ type: 'APPEND_CHUNK', payload: { id: assistantMsgId, chunk } });
      }
      dispatch({ type: 'STREAM_COMPLETE' });

      // Uncle Bob Audit #4: Silent Data Loss Prevention. Save stream outcome to ProjectEntity then to IStoragePort
      try {
        // Ensure standard conversation exists (fallback for UI missing robust conversation switching logic)
        const chatConvoId = 'primary-sandbox';
        if (!entity.conversations.find(c => c.id === chatConvoId)) {
          entity.addConversation(chatConvoId, 'Sandbox Session');
        }
        
        entity.addMessage(chatConvoId, { role: 'user', content: userInput });
        entity.addMessage(chatConvoId, { role: 'assistant', content: finalAssistantContent });
        
        await storage.saveProject(user.uid, entity);
      } catch (saveError) {
        console.error("Failed to persist conversation state to backend", saveError);
      }

    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') {
        dispatch({ type: 'ABORT_STREAM', payload: { id: assistantMsgId } });
      } else {
        console.error("Chat error", error);
        toast.error(`Engine Desync: ${(error as Error).message || 'Stream Terminated'}`);
        dispatch({ type: 'STREAM_ERROR', payload: { id: assistantMsgId, error: '\n\n[Connection lost. The core is re-calibrating.]' } });
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
