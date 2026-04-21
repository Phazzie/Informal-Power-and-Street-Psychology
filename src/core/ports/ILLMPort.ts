import { ConversationMessage } from '../../types';

export interface LLMRequestOptions {
  signal?: AbortSignal;
}

export interface ILLMPort {
  /**
   * Provide a deep structural analysis of raw unformatted prose.
   */
  analyzeMaterial(authorVoice: string, options?: LLMRequestOptions): Promise<any>;

  /**
   * Initiate an async generator to stream chunked text responses mimicking a conversational AI.
   */
  streamChat(projectName: string, authorVoice: string, history: ConversationMessage[], message: string, options?: LLMRequestOptions): AsyncGenerator<string, void, unknown>;
}
