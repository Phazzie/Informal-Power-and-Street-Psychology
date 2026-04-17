import { Project, Conversation, ConversationMessage } from '../types';

export function parseClaudeExport(json: any): Project[] {
  // Attempt to parse based on common Claude export structures
  
  if (Array.isArray(json)) {
    // If it's just a top-level list of conversations, treat as one project or multiple
    // We'll group them by some metadata or just one big project
    return [{
      id: 'import-' + Date.now(),
      name: 'Imported Conversations',
      conversations: json.map((c: any) => parseConversation(c))
    }];
  }

  if (json.projects && Array.isArray(json.projects)) {
    return json.projects.map((p: any) => ({
      id: p.id || p.uuid || Math.random().toString(36),
      name: p.name || 'Untitled Project',
      conversations: (p.conversations || p.chat_history || []).map((c: any) => parseConversation(c))
    }));
  }

  // Handle single project export
  if (json.conversations || json.chat_history) {
    return [{
      id: json.id || json.uuid || 'single-project',
      name: json.name || 'Imported Project',
      conversations: (json.conversations || json.chat_history || []).map((c: any) => parseConversation(c))
    }];
  }

  return [];
}

function parseConversation(c: any): Conversation {
  const messages: ConversationMessage[] = (c.chat_messages || c.messages || []).map((m: any) => ({
    role: m.sender === 'human' || m.role === 'user' ? 'user' : 'assistant',
    content: m.text || m.content || ''
  }));

  return {
    id: c.uuid || c.id || Math.random().toString(36),
    name: c.name || 'Untitled Conversation',
    messages
  };
}

export function exportAuthorVoice(project: Project): string {
  return project.conversations
    .flatMap(c => c.messages)
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n\n---NEXT---\n\n');
}
