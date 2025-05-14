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

import { LLMProvider } from "./types/api";
import { LLMModelData, ModelCapabilities } from "./types/api";

/**
 * Cache TTL values for each provider in milliseconds
 */
export const PROVIDER_CACHE_TTL: Record<LLMProvider, number> = {
  [LLMProvider.OPENAI]: 86400000, // 24 hours
  [LLMProvider.ANTHROPIC]: 86400000,
  [LLMProvider.GOOGLE]: 86400000,
  [LLMProvider.GROQ]: 86400000,
  [LLMProvider.COHERE]: 86400000,
  [LLMProvider.DEEPSEEK]: 86400000,
  [LLMProvider.MISTRAL]: 86400000,
  [LLMProvider.AMAZON]: 86400000,
  [LLMProvider.AZURE]: 86400000,
  [LLMProvider.FIREWORKS]: 86400000,
  [LLMProvider.TOGETHERAI]: 86400000,
  [LLMProvider.PERPLEXITY]: 86400000,
  [LLMProvider.DEEPINFRA]: 86400000,
  [LLMProvider.XAI]: 86400000,
  [LLMProvider.OLLAMA]: 86400000,
  [LLMProvider.HUGGINGFACE]: 86400000,
  [LLMProvider.CEREBRAS]: 86400000,
  [LLMProvider.ELEVENLABS]: 86400000,
  [LLMProvider.GLADIA]: 86400000,
  [LLMProvider.ASSEMBLYAI]: 86400000,
  [LLMProvider.REVAI]: 86400000,
  [LLMProvider.DEEPGRAM]: 86400000,
  [LLMProvider.LMNT]: 86400000,
  [LLMProvider.HUME]: 86400000,
  [LLMProvider.OPENROUTER]: 43200000, // 12 hours
  [LLMProvider.CHUTES]: 86400000,
  [LLMProvider.CUSTOM]: 86400000,
};

/**
 * Default models by provider - These will be used as fallbacks when API data is unavailable
 */
export const DEFAULT_PROVIDER_MODELS: Record<LLMProvider, LLMModelData[]> = {
  [LLMProvider.OPENAI]: [
    {
      id: "gpt-4o",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 10,
      owned_by: "openai",
      display_name: "GPT-4o",
      provider_model_id: "gpt-4o",
      context_length: 128000,
      capabilities: {
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        supports_tool_calling: true,
        supports_streaming: true,
        supports_vision: true,
      },
    },
  ],
  [LLMProvider.ANTHROPIC]: [
    {
      id: "claude-3-5-sonnet-20240620",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 5,
      owned_by: "anthropic",
      display_name: "Claude 3.5 Sonnet",
      provider_model_id: "claude-3-5-sonnet-20240620",
      context_length: 200000,
      capabilities: {
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        supports_streaming: true,
        supports_vision: true,
      },
    },
  ],
  [LLMProvider.GOOGLE]: [
    {
      id: "gemini-pro",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      owned_by: "google",
      display_name: "Gemini Pro",
      provider_model_id: "gemini-pro",
      context_length: 32768,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.GROQ]: [],
  [LLMProvider.COHERE]: [],
  [LLMProvider.DEEPSEEK]: [],
  [LLMProvider.MISTRAL]: [],
  [LLMProvider.AMAZON]: [],
  [LLMProvider.AZURE]: [],
  [LLMProvider.FIREWORKS]: [],
  [LLMProvider.TOGETHERAI]: [],
  [LLMProvider.PERPLEXITY]: [],
  [LLMProvider.DEEPINFRA]: [],
  [LLMProvider.XAI]: [],
  [LLMProvider.OLLAMA]: [],
  [LLMProvider.HUGGINGFACE]: [],
  [LLMProvider.CEREBRAS]: [],
  [LLMProvider.ELEVENLABS]: [],
  [LLMProvider.GLADIA]: [],
  [LLMProvider.ASSEMBLYAI]: [],
  [LLMProvider.REVAI]: [],
  [LLMProvider.DEEPGRAM]: [],
  [LLMProvider.LMNT]: [],
  [LLMProvider.HUME]: [],
  [LLMProvider.OPENROUTER]: [],
  [LLMProvider.CHUTES]: [],
  [LLMProvider.CUSTOM]: [],
};

/**
 * Default models to show when no provider is available
 */
export const DEFAULT_MODELS: LLMModelData[] = [
  {
    id: "gpt-3.5-turbo",
    object: "model",
    created: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    owned_by: "openai",
    display_name: "GPT-3.5 Turbo",
    provider_model_id: "gpt-3.5-turbo",
  },
];

/**
 * Special OpenRouter models for routing features
 */
export const OPENROUTER_ROUTING_MODELS: LLMModelData[] = [
  {
    id: "openrouter/auto",
    object: "model",
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: "openrouter",
    display_name: "OpenRouter Auto",
    provider_model_id: "auto",
    context_length: 128000,
    capabilities: {
      input_modalities: ["text"],
      output_modalities: ["text"],
      supports_streaming: true,
    },
  },
  {
    id: "openrouter/best",
    object: "model",
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: "openrouter",
    display_name: "OpenRouter Best",
    provider_model_id: "best",
    context_length: 128000,
    capabilities: {
      input_modalities: ["text"],
      output_modalities: ["text"],
      supports_streaming: true,
    },
  },
  {
    id: "openrouter/fastest",
    object: "model",
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: "openrouter",
    display_name: "OpenRouter Fastest",
    provider_model_id: "fastest",
    context_length: 128000,
    capabilities: {
      input_modalities: ["text"],
      output_modalities: ["text"],
      supports_streaming: true,
    },
  },
  {
    id: "openrouter/cheapest",
    object: "model",
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: "openrouter",
    display_name: "OpenRouter Cheapest",
    provider_model_id: "cheapest",
    context_length: 128000,
    capabilities: {
      input_modalities: ["text"],
      output_modalities: ["text"],
      supports_streaming: true,
    },
  },
];

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
  CHUTES: "chutes",
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
    chutes: "Chutes AI",
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
