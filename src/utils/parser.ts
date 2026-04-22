import { Project, Conversation, ConversationMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { APP_CONSTANTS } from '../core/config/constants';

// Uncle Bob Audit Phase 1.4: Strict Zod checking for unknown imported payloads
const MessageSchema = z.object({
  sender: z.string().optional(),
  role: z.string().optional(),
  text: z.string().optional(),
  content: z.string().optional()
}).catchall(z.unknown()); // Only capture the ones we care about, gracefully ignore others

const ConversationSchema = z.object({
  uuid: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  chat_messages: z.array(MessageSchema).optional(),
  messages: z.array(MessageSchema).optional(),
}).catchall(z.unknown());

export function parseClaudeExport(json: unknown): Project[] {
  // Attempt to parse based on common Claude export structures
  try {
    if (Array.isArray(json)) {
      return [{
        id: 'import-' + Date.now(),
        name: 'Imported Conversations',
        conversations: json.map((c: unknown) => parseConversation(c))
      }];
    }

    const dict = json as Record<string, unknown>;

    if (dict.projects && Array.isArray(dict.projects)) {
      return dict.projects.map((p: any) => ({
        id: p.id || p.uuid || uuidv4(),
        name: p.name || 'Untitled Project',
        conversations: (p.conversations || p.chat_history || []).map((c: unknown) => parseConversation(c))
      }));
    }

    // Handle single project export
    if (dict.conversations || dict.chat_history) {
      return [{
        id: (dict.id as string) || (dict.uuid as string) || 'single-project',
        name: (dict.name as string) || 'Imported Project',
        conversations: ((dict.conversations || dict.chat_history || []) as unknown[]).map(c => parseConversation(c))
      }];
    }
  } catch (error) {
    console.error("Payload digestion failed: Corrupted JSON structure", error);
  }

  return [];
}

function parseConversation(rawObj: unknown): Conversation {
  const c = ConversationSchema.parse(rawObj);
  
  const rawMessages = c.chat_messages || c.messages || [];
  
  const messages: ConversationMessage[] = rawMessages.map(m => ({
    role: m.sender === 'human' || m.role === 'user' ? APP_CONSTANTS.ROLES.USER : APP_CONSTANTS.ROLES.ASSISTANT,
    content: m.text || m.content || ''
  }));

  return {
    id: c.uuid || c.id || uuidv4(),
    name: c.name || 'Untitled Conversation',
    messages
  };
}
