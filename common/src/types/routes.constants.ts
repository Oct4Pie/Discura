/**
 * Routes Constants
 *
 * This file serves as the single source of truth for all API routes in Discura.
 * These constants are used by both controllers and frontend/backend code.
 *
 * IMPORTANT: When using these constants in TSOA decorators, you must use
 * the string literals directly in the controller files - TSOA cannot resolve
 * imported constants during code generation.
 */

// Base route paths
export const BASE_ROUTES = {
  AUTH: "auth",
  BOTS: "bots",
  LLM: "llm",
  CONSTANTS: "constants",
  KNOWLEDGE: "knowledge",
};

// Auth endpoint paths
export const AUTH_PATHS = {
  PROFILE: "profile",
  LOGIN: "login",
  REGISTER: "register",
  LOGOUT: "logout",
  DISCORD: "discord",
  DISCORD_CALLBACK: "discord/callback",
};

// Bot endpoint paths
export const BOT_PATHS = {
  BY_ID: "{id}",
  START: "{id}/start",
  STOP: "{id}/stop",
  KNOWLEDGE: "{id}/knowledge",
  KNOWLEDGE_ITEM: "{botId}/knowledge/{itemId}",
  INVITE: "{id}/invite",
};

// LLM endpoint paths
export const LLM_PATHS = {
  MODELS: "models",
  COMPLETION: "chat/completions",
  PROVIDERS: "providers",
  PROVIDER_BY_ID: "providers/{provider}",
};

// Full API routes with prefixes (for frontend use)
export const API_ROUTES = {
  // Auth routes
  AUTH: {
    BASE: `/api/${BASE_ROUTES.AUTH}`,
    PROFILE: `/api/${BASE_ROUTES.AUTH}/${AUTH_PATHS.PROFILE}`,
    LOGIN: `/api/${BASE_ROUTES.AUTH}/${AUTH_PATHS.LOGIN}`,
    REGISTER: `/api/${BASE_ROUTES.AUTH}/${AUTH_PATHS.REGISTER}`,
    LOGOUT: `/api/${BASE_ROUTES.AUTH}/${AUTH_PATHS.LOGOUT}`,
    DISCORD: `/api/${BASE_ROUTES.AUTH}/${AUTH_PATHS.DISCORD}`,
    DISCORD_CALLBACK: `/api/${BASE_ROUTES.AUTH}/${AUTH_PATHS.DISCORD_CALLBACK}`,
  },

  // Bot routes
  BOTS: {
    BASE: `/api/${BASE_ROUTES.BOTS}`,
    BY_ID: (id: string) => `/api/${BASE_ROUTES.BOTS}/${id}`,
    START: (id: string) => `/api/${BASE_ROUTES.BOTS}/${id}/start`,
    STOP: (id: string) => `/api/${BASE_ROUTES.BOTS}/${id}/stop`,
    KNOWLEDGE: (botId: string) => `/api/${BASE_ROUTES.BOTS}/${botId}/knowledge`,
    KNOWLEDGE_ITEM: (botId: string, itemId: string) =>
      `/api/${BASE_ROUTES.BOTS}/${botId}/knowledge/${itemId}`,
    INVITE: (id: string) => `/api/${BASE_ROUTES.BOTS}/${id}/invite`,
  },

  // LLM routes
  LLM: {
    BASE: `/api/${BASE_ROUTES.LLM}`,
    MODELS: `/api/${BASE_ROUTES.LLM}/${LLM_PATHS.MODELS}`,
    COMPLETION: `/api/${BASE_ROUTES.LLM}/${LLM_PATHS.COMPLETION}`,
    PROVIDERS: `/api/${BASE_ROUTES.LLM}/${LLM_PATHS.PROVIDERS}`,
    PROVIDER_BY_ID: (provider: string) =>
      `/api/${BASE_ROUTES.LLM}/providers/${provider}`,
  },

  // Constants route
  CONSTANTS: {
    BASE: `/api/${BASE_ROUTES.CONSTANTS}`,
  },
};

// Backend controller routes (for reference in TSOA controllers)
// IMPORTANT: These values must be copied directly in @Route decorators
// Do not import them for use in decorators, as TSOA won't resolve them
export const CONTROLLER_ROUTES = {
  AUTH: BASE_ROUTES.AUTH,
  BOTS: BASE_ROUTES.BOTS,
  LLM: BASE_ROUTES.LLM,
  CONSTANTS: BASE_ROUTES.CONSTANTS,
};
