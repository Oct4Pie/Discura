/**
 * Application Constants
 * 
 * This file serves as the single source of truth for all constant values used throughout the application.
 * Never hard-code string literals, status values, or configuration constants elsewhere in the codebase.
 * 
 * To use these constants:
 * - Import from '@common/constants' in both frontend and backend
 * - For generated files, ensure they reference these constants
 */

// Bot Status Constants
export const BOT_STATUS = {
  // Enum values (for database and API)
  OFFLINE: 'offline',
  ONLINE: 'online',
  ERROR: 'error',
  
  // Display labels (for UI)
  LABELS: {
    offline: 'Offline',
    online: 'Online',
    error: 'Error'
  },
  
  // Material UI color mappings
  COLORS: {
    offline: 'default',
    online: 'success',
    error: 'error'
  }
};

// LLM Provider Constants
export const LLM_PROVIDER = {
  // Enum values
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  CUSTOM: 'custom',
  
  // Display labels
  LABELS: {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
    custom: 'Custom API'
  }
};

// Image Provider Constants
export const IMAGE_PROVIDER = {
  OPENAI: 'openai',
  STABILITY: 'stability',
  MIDJOURNEY: 'midjourney',
  
  // Display labels
  LABELS: {
    openai: 'DALL-E (OpenAI)',
    stability: 'Stability AI',
    midjourney: 'Midjourney'
  }
};

// Common HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_STORAGE: 'auth-storage',
  USER_PREFERENCES: 'user-preferences',
  THEME_MODE: 'theme-mode'
};

// Default Values
export const DEFAULTS = {
  BOT: {
    SYSTEM_PROMPT: 'You are a helpful Discord bot assistant.',
    PERSONALITY: 'Friendly and helpful',
    TRAITS: ['helpful', 'friendly', 'knowledgeable'],
    LLM_PROVIDER: LLM_PROVIDER.OPENAI,
    LLM_MODEL: 'gpt-3.5-turbo'
  }
};

// Environment Variable Names
export const ENV_VARS = {
  API_URL: 'VITE_API_URL',
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DB_PATH: 'DB_PATH',
  JWT_SECRET: 'JWT_SECRET',
  DISCORD_CLIENT_ID: 'DISCORD_CLIENT_ID',
  DISCORD_CLIENT_SECRET: 'DISCORD_CLIENT_SECRET',
  DISCORD_CALLBACK_URL: 'DISCORD_CALLBACK_URL'
};

// Discord API Constants
export const DISCORD_API = {
  BASE_URL: 'https://discord.com/api',
  OAUTH2_URL: 'https://discord.com/api/oauth2/authorize',
  PERMISSIONS: {
    SEND_MESSAGES: 'SendMessages',
    VIEW_CHANNEL: 'ViewChannel',
    READ_MESSAGE_HISTORY: 'ReadMessageHistory',
    ATTACH_FILES: 'AttachFiles',
    EMBED_LINKS: 'EmbedLinks'
  },
  SCOPES: {
    BOT: 'bot',
    APPLICATIONS_COMMANDS: 'applications.commands'
  },
  // Common permission integer combinations
  PERMISSION_INTEGERS: {
    BASIC_BOT: '277025459200' // SendMessages, ViewChannel, ReadMessageHistory, AttachFiles, EmbedLinks
  }
};