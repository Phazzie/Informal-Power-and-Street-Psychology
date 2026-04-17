export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: ConversationMessage[];
}

export interface Project {
  id: string;
  name: string;
  conversations: Conversation[];
}

export interface UnderdevelopedIdea {
  concept: string;
  initialIntroduction: string;
  lackOfFollowThrough: string;
}

export interface CandidateThesis {
  statement: string;
  support: string;
  originalContext: string;
}

export interface AnalysisResult {
  materialSummary: string;
  authorLines: { line: string; resonance: number }[];
  underdevelopedIdeas: UnderdevelopedIdea[];
  conventional: {
    conceptMap: string;
    storyInventory: string;
    gapAnalysis: string;
  };
  unconventional: {
    throwawayLines: string[];
    emotionalSpine: string;
    contradictions: string;
    candidateTheses: CandidateThesis[];
  };
}

export type AnalysisLens = 'default' | 'conventional' | 'unconventional';
