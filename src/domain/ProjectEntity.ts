import { Conversation, ConversationMessage, Project } from '../types';
import { APP_CONSTANTS } from '../core/config/constants';

export class ProjectEntity implements Project {
  public id: string;
  public name: string;
  public conversations: Conversation[];

  constructor(id: string, name: string, conversations: Conversation[] = []) {
    if (!id || id.trim() === '') throw new Error('Project ID cannot be empty');
    if (!name || name.trim() === '') throw new Error('Project name cannot be empty');
    
    this.id = id;
    this.name = name;
    this.conversations = conversations;
  }

  static fromDTO(dto: Project): ProjectEntity {
    return new ProjectEntity(dto.id, dto.name, dto.conversations || []);
  }

  toDTO(): Project {
    return {
      id: this.id,
      name: this.name,
      conversations: [...this.conversations]
    };
  }

  addConversation(id: string, name: string): void {
    if (!id) throw new Error('Conversation ID required');
    if (this.conversations.some(c => c.id === id)) {
      throw new Error('Conversation with this ID already exists');
    }
    
    this.conversations.push({
      id,
      name: name || 'Untitled Session',
      messages: []
    });
  }

  addMessage(conversationId: string, message: ConversationMessage): void {
    const convo = this.conversations.find(c => c.id === conversationId);
    if (!convo) throw new Error('Conversation not found');
    
    if (!message.content || message.content.trim() === '') {
      throw new Error('Message content cannot be empty');
    }
    
    convo.messages.push(message);
  }

  // Centralized Voice Extraction (Audit #4.4)
  getAuthorVoiceBlob(): string {
    const rawVoice = this.conversations
      .flatMap(c => c.messages)
      .filter(m => m.role === APP_CONSTANTS.ROLES.USER)
      .map(m => m.content)
      .join('\n\n---NEXT---\n\n');
      
    // Enforce limits early safely
    return rawVoice.slice(-APP_CONSTANTS.LIMITS.MAX_AUTHOR_VOICE_BYTES);
  }

  clone(): ProjectEntity {
    // Deep clone the conversations array to prevent accidental mutations
    const clonedConvos = JSON.parse(JSON.stringify(this.conversations));
    return new ProjectEntity(this.id, this.name, clonedConvos);
  }
}
