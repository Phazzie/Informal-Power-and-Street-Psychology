import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { Send, MessageSquare, Terminal, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithProject } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function Chat({ project, isOpen, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !project || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      let assistantContent = '';
      const stream = chatWithProject(project, history, input);
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantContent;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection lost. The core is re-calibrating.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-bg-surface flex flex-col min-h-0">
      <div className="px-5 py-4 border-b section-border bg-bg-surface shrink-0">
        <h2 className="text-[0.85rem] font-bold text-text-main tracking-tight">DEVELOPMENTAL EDITOR</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="py-8 text-center space-y-3">
            <MessageSquare className="w-6 h-6 text-text-dim/20 mx-auto" />
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-text-dim/40 leading-relaxed">
              Scan for subsurface patterns
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn(
            "text-[0.85rem] leading-relaxed",
            m.role === 'user' ? "text-text-main bg-bg-card p-3 rounded-lg border border-border-main" : "text-text-dim"
          )}>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-1.5 opacity-40 px-2">
            <div className="w-1 h-1 bg-accent-orange rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-accent-orange rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1 h-1 bg-accent-orange rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      <div className="p-5 border-t section-border bg-bg-surface shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as any)}
          placeholder="Dig deeper into the material..."
          className="w-full bg-bg-deep border border-border-main px-4 py-2.5 rounded-md text-[0.85rem] text-text-dim placeholder:text-text-dim/30 outline-none focus:border-accent-orange/50 transition-colors"
        />
      </div>
    </div>
  );
}
