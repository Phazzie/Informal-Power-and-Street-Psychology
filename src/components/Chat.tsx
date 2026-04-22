import React, { memo } from 'react';
import { Project } from '../types';
import { MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';

const MemoizedMessage = memo(({ m }: { m: { role: string; content: string } }) => {
  return (
    <div className={cn(
      "text-[0.85rem] leading-relaxed",
      m.role === 'user' ? "text-text-main bg-bg-card p-3 rounded-lg border border-border-main" : "text-text-dim"
    )}>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{m.content}</ReactMarkdown>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the content actually changes. 
  // This prevents the entire history array from re-parsing Markdown on every single stream chunk.
  return prevProps.m.content === nextProps.m.content && prevProps.m.role === nextProps.m.role;
});

interface ChatProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Chat({ project, isOpen, onClose }: ChatProps) {
  const { messages, input, setInput, isTyping, scrollRef, handleSubmit } = useChat(project);

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-bg-surface flex flex-col min-h-0" role="complementary" aria-label="Developmental Editor Chat">
      <div className="px-5 py-4 border-b section-border bg-bg-surface shrink-0">
        <h2 className="text-[0.85rem] font-bold text-text-main tracking-tight">DEVELOPMENTAL EDITOR</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar" ref={scrollRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="py-8 text-center space-y-3">
            <MessageSquare className="w-6 h-6 text-text-dim/20 mx-auto" aria-hidden="true" />
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-text-dim/40 leading-relaxed">
              Scan for subsurface patterns
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <MemoizedMessage key={i} m={m} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-1.5 opacity-40 px-2" role="status" aria-label="AI is typing...">
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
               e.preventDefault();
               handleSubmit();
            }
          }}
          placeholder="Dig deeper into the material..."
          className="w-full bg-bg-deep border border-border-main px-4 py-2.5 rounded-md text-[0.85rem] text-text-dim placeholder:text-text-dim/30 outline-none focus:border-accent-orange/50 transition-colors"
          aria-label="Chat input"
        />
      </div>
    </div>
  );
}
