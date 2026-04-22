import { z } from 'zod';

export const ENV = {
  // Backend Environment parsing
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Model Configurations
  MODELS: {
    TEXT_FLASH: 'gemini-3.1-flash-preview',
    LIVE: 'gemini-3.1-flash-live-preview',
  }
} as const;

// Ensure runtime block for missing critical variables
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  if (!ENV.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
  }
}
