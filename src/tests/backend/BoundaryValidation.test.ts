import { describe, it, expect } from 'vitest';
import { AnalyzeSchema, ChatSchema } from '../../backend/routes';

describe('Backend Boundary Validation (Zod)', () => {
  describe('AnalyzeSchema', () => {
    it('should validate correct payload', () => {
      const validPayload = { authorVoice: 'Some massive text here' };
      const res = AnalyzeSchema.safeParse(validPayload);
      expect(res.success).toBe(true);
    });

    it('should reject missing authorVoice', () => {
      const invalidPayload = {};
      const res = AnalyzeSchema.safeParse(invalidPayload);
      expect(res.success).toBe(false);
    });

    it('should reject non-string authorVoice', () => {
      const invalidPayload = { authorVoice: 123 };
      const res = AnalyzeSchema.safeParse(invalidPayload);
      expect(res.success).toBe(false);
    });
  });

  describe('ChatSchema', () => {
    it('should validate correct payload', () => {
      const validPayload = {
        authorVoice: 'Context...',
        projectName: 'My Project',
        message: 'Hello Assistant',
        history: [{ role: 'user', content: 'Hi' }]
      };
      const res = ChatSchema.safeParse(validPayload);
      expect(res.success).toBe(true);
    });

    it('should reject invalid history roles', () => {
      const invalidPayload = {
        authorVoice: 'Context...',
        projectName: 'My Project',
        message: 'Hello Assistant',
        history: [{ role: 'alien', content: 'Take me to your leader' }]
      };
      const res = ChatSchema.safeParse(invalidPayload);
      expect(res.success).toBe(false);
    });

    it('should reject completely missing fields', () => {
      const invalidPayload = {
        message: 'Hello Assistant',
      };
      const res = ChatSchema.safeParse(invalidPayload);
      expect(res.success).toBe(false);
    });
  });
});
