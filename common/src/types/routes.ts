/**
 * API Route Constants
 * 
 * This file serves as the single source of truth for all API routes in Discura.
 * These constants are used by both the frontend and backend to ensure consistency.
 * 
 * DO NOT HARDCODE ROUTE PATHS ANYWHERE ELSE IN THE CODEBASE.
 */

// Base route segments
export const ROUTES = {
  AUTH: 'auth',
  BOTS: 'bots',
  LLM: 'llm',
  KNOWLEDGE: 'knowledge',
  
  // Auth-related endpoints
  AUTH_ENDPOINTS: {
    PROFILE: 'profile',
    LOGOUT: 'logout',
    DISCORD: 'discord',
    DISCORD_CALLBACK: 'discord/callback'
  },
  
  // Bot-related endpoints
  BOT_ENDPOINTS: {
    BY_ID: (id: string) => `${id}`,
    START: (id: string) => `${id}/start`,
    STOP: (id: string) => `${id}/stop`,
    KNOWLEDGE: (id: string) => `${id}/knowledge`,
    KNOWLEDGE_ITEM: (botId: string, itemId: string) => `${botId}/knowledge/${itemId}`
  },
  
  // LLM-related endpoints
  LLM_ENDPOINTS: {
    MODELS: 'models',
    COMPLETION: 'chat/completions'
  }
};

// Full route paths (for frontend use)
export const API_ROUTES = {
  // Auth routes
  AUTH: {
    BASE: `/api/${ROUTES.AUTH}`,
    PROFILE: `/api/${ROUTES.AUTH}/${ROUTES.AUTH_ENDPOINTS.PROFILE}`,
    LOGOUT: `/api/${ROUTES.AUTH}/${ROUTES.AUTH_ENDPOINTS.LOGOUT}`,
    DISCORD: `/api/${ROUTES.AUTH}/${ROUTES.AUTH_ENDPOINTS.DISCORD}`,
    DISCORD_CALLBACK: `/api/${ROUTES.AUTH}/${ROUTES.AUTH_ENDPOINTS.DISCORD_CALLBACK}`
  },
  
  // Bot routes
  BOTS: {
    BASE: `/api/${ROUTES.BOTS}`,
    BY_ID: (id: string) => `/api/${ROUTES.BOTS}/${ROUTES.BOT_ENDPOINTS.BY_ID(id)}`,
    START: (id: string) => `/api/${ROUTES.BOTS}/${ROUTES.BOT_ENDPOINTS.START(id)}`,
    STOP: (id: string) => `/api/${ROUTES.BOTS}/${ROUTES.BOT_ENDPOINTS.STOP(id)}`,
    KNOWLEDGE: {
      BASE: (botId: string) => `/api/${ROUTES.BOTS}/${ROUTES.BOT_ENDPOINTS.KNOWLEDGE(botId)}`,
      BY_ID: (botId: string, itemId: string) => `/api/${ROUTES.BOTS}/${ROUTES.BOT_ENDPOINTS.KNOWLEDGE_ITEM(botId, itemId)}`
    }
  },
  
  // LLM routes
  LLM: {
    BASE: `/api/${ROUTES.LLM}`,
    MODELS: `/api/${ROUTES.LLM}/${ROUTES.LLM_ENDPOINTS.MODELS}`,
    COMPLETION: `/api/${ROUTES.LLM}/${ROUTES.LLM_ENDPOINTS.COMPLETION}`
  }
};

// Backend route paths (for TSOA controllers)
export const CONTROLLER_ROUTES = {
  AUTH: ROUTES.AUTH,
  BOTS: ROUTES.BOTS,
  LLM: ROUTES.LLM,
  // Fix: Change the Knowledge route to use a path without parameters
  // This will work better with the TSOA controller implementation
  KNOWLEDGE: `${ROUTES.BOTS}/{botId}/${ROUTES.KNOWLEDGE}`
};

export * from '../routes/routes';