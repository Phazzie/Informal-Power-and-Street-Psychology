export const APP_CONSTANTS = {
  // Storage
  STORAGE_KEYS: {
    SELECTED_PROJECT: 'subsurface_selected_project',
  },
  
  // Logic Limits
  LIMITS: {
    MAX_AUTHOR_VOICE_BYTES: 200000,
  },

  // API Endpoints
  API_ROUTES: {
    ANALYZE: '/api/analyze',
    CHAT: '/api/chat',
    LIVE_TICKET: '/api/live/ticket',
    LIVE_WS: '/api/live',
  },

  ROLES: {
    USER: 'user',
    ASSISTANT: 'assistant',
    MODEL: 'model'
  }
} as const;
