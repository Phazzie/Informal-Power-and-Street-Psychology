import { ILLMPort, LLMRequestOptions } from '../core/ports/ILLMPort';
import { ConversationMessage } from '../types';
import { exportAuthorVoice } from '../utils/parser';
import { getAuth } from 'firebase/auth';

export class HttpLLMAdapter implements ILLMPort {
  
  private async getAuthHeaders(): Promise<Record<string, string>> {
     const auth = getAuth();
     if (!auth.currentUser) {
       throw new Error("Unauthorized: Please sign in.");
     }
     const token = await auth.currentUser.getIdToken();
     return {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     };
  }

  async analyzeMaterial(authorVoice: string, options?: LLMRequestOptions): Promise<any> {
    const headers = await this.getAuthHeaders();
    
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ authorVoice }),
      signal: options?.signal
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze project material.');
    }

    return await res.json();
  }

  async *streamChat(projectName: string, authorVoice: string, history: ConversationMessage[], message: string, options?: LLMRequestOptions): AsyncGenerator<string, void, unknown> {
    const headers = await this.getAuthHeaders();

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        authorVoice, 
        projectName, 
        message, 
        history 
      }),
      signal: options?.signal
    });

    if (!res.ok || !res.body) {
      if (res.status === 401 || res.status === 403) {
         throw new Error('Authentication Rejected. Engine connection severed.');
      }
      throw new Error('Failed to output Chat Stream.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  }
}
