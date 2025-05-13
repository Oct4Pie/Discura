import {
  BotStatusConstants,
  LlmProviderConstants,
  ImageProviderConstants,
  HttpStatusConstants,
  StorageKeysConstants,
  DefaultsConstants,
  EnvVarsConstants,
  DiscordApiConstants,
  Constants,
} from "./types/api/";

// Bot Status Constants
export const BOT_STATUS: BotStatusConstants = {
  // Enum values (for database and API)
  OFFLINE: "offline",
  ONLINE: "online",
  ERROR: "error",

  // Display labels (for UI)
  LABELS: {
    offline: "Offline",
    online: "Online",
    error: "Error",
  },

  // Material UI color mappings
  COLORS: {
    offline: "default",
    online: "success",
    error: "error",
  },
};

// LLM Provider Constants
export const LLM_PROVIDER: LlmProviderConstants = {
  // Enum values
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  GROQ: "groq",
  COHERE: "cohere",
  DEEPSEEK: "deepseek",
  MISTRAL: "mistral",
  AMAZON: "amazon",
  AZURE: "azure",
  FIREWORKS: "fireworks",
  TOGETHERAI: "togetherai",
  PERPLEXITY: "perplexity",
  DEEPINFRA: "deepinfra",
  XAI: "xai",
  OLLAMA: "ollama",
  HUGGINGFACE: "huggingface",
  CEREBRAS: "cerebras",
  ELEVENLABS: "elevenlabs",
  GLADIA: "gladia",
  ASSEMBLYAI: "assemblyai",
  REVAI: "revai",
  DEEPGRAM: "deepgram",
  LMNT: "lmnt",
  HUME: "hume",
  OPENROUTER: "openrouter",
  CUSTOM: "custom",

  // Display labels
  LABELS: {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google AI",
    groq: "Groq",
    cohere: "Cohere",
    deepseek: "DeepSeek",
    mistral: "Mistral AI",
    amazon: "Amazon Bedrock",
    azure: "Azure OpenAI",
    fireworks: "Fireworks AI",
    togetherai: "Together AI",
    perplexity: "Perplexity",
    deepinfra: "DeepInfra",
    xai: "xAI Grok",
    ollama: "Ollama",
    huggingface: "Hugging Face",
    cerebras: "Cerebras",
    elevenlabs: "ElevenLabs",
    gladia: "Gladia",
    assemblyai: "AssemblyAI",
    revai: "Rev.ai",
    deepgram: "Deepgram",
    lmnt: "LMNT",
    hume: "Hume",
    openrouter: "OpenRouter",
    custom: "Custom API",
  },
};

// Image Provider Constants
export const IMAGE_PROVIDER: ImageProviderConstants = {
  OPENAI: "openai",
  STABILITY: "stability",
  MIDJOURNEY: "midjourney",

  // Display labels
  LABELS: {
    openai: "DALL-E (OpenAI)",
    stability: "Stability AI",
    midjourney: "Midjourney",
  },
};

// Common HTTP Status Codes
export const HTTP_STATUS: HttpStatusConstants = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Local Storage Keys
export const STORAGE_KEYS: StorageKeysConstants = {
  AUTH_STORAGE: "auth-storage", // Used by frontend for storing auth related data
  USER_PREFERENCES: "user-preferences", // Used by frontend for user specific preferences
  THEME_MODE: "theme-mode", // Used by frontend for theme preference
  AUTH_TOKEN: "auth_token", // Potentially shared or for frontend local storage
  USER_PROFILE: "user_profile", // Potentially shared or for frontend local storage
};

// Default Values
export const DEFAULTS: DefaultsConstants = {
  BOT: {
    SYSTEM_PROMPT: "You are a helpful Discord bot assistant.",
    PERSONALITY: "Friendly and helpful",
    TRAITS: ["helpful", "friendly", "knowledgeable"],
    LLM_PROVIDER: LLM_PROVIDER.OPENAI,
    LLM_MODEL: "gpt-3.5-turbo",
  },
};

// Environment Variable Names
export const ENV_VARS: EnvVarsConstants = {
  API_URL: "VITE_API_URL",
  NODE_ENV: "NODE_ENV",
  PORT: "PORT",
  DB_PATH: "DB_PATH",
  JWT_SECRET: "JWT_SECRET",
  DISCORD_CLIENT_ID: "DISCORD_CLIENT_ID",
  DISCORD_CLIENT_SECRET: "DISCORD_CLIENT_SECRET",
  DISCORD_CALLBACK_URL: "DISCORD_CALLBACK_URL",
};

// Discord API Constants
export const DISCORD_API: DiscordApiConstants = {
  BASE_URL: "https://discord.com/api",
  OAUTH2_URL: "https://discord.com/api/oauth2/authorize",
  PERMISSIONS: {
    SEND_MESSAGES: "SendMessages",
    VIEW_CHANNEL: "ViewChannel",
    READ_MESSAGE_HISTORY: "ReadMessageHistory",
    ATTACH_FILES: "AttachFiles",
    EMBED_LINKS: "EmbedLinks",
  },
  SCOPES: {
    BOT: "bot",
    APPLICATIONS_COMMANDS: "applications.commands",
  },
  // Common permission integer combinations
  PERMISSION_INTEGERS: {
    BASIC_BOT: "277025459200", // SendMessages, ViewChannel, ReadMessageHistory, AttachFiles, EmbedLinks
  },
};

/**
 * Combined constants object for API export
 */
export const CONSTANTS: Constants = {
  BOT_STATUS,
  LLM_PROVIDER,
  IMAGE_PROVIDER,
  HTTP_STATUS,
  STORAGE_KEYS,
  DEFAULTS,
  ENV_VARS,
  DISCORD_API,
};
