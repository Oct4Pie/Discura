/**
 * Bot status structure for API
 * @tsoaModel
 */
export interface BotStatusConstants {
  OFFLINE: string;
  ONLINE: string;
  ERROR: string;
  LABELS: {
    offline: string;
    online: string;
    error: string;
  };
  COLORS: {
    offline: string;
    online: string;
    error: string;
  };
}

/**
 * LLM provider structure for API
 * @tsoaModel
 */
export interface LlmProviderConstants {
  OPENAI: string;
  ANTHROPIC: string;
  GOOGLE: string;
  GROQ: string;
  COHERE: string;
  DEEPSEEK: string;
  MISTRAL: string;
  AMAZON: string;
  AZURE: string;
  FIREWORKS: string;
  TOGETHERAI: string;
  PERPLEXITY: string;
  DEEPINFRA: string;
  XAI: string;
  OLLAMA: string;
  HUGGINGFACE: string;
  CEREBRAS: string;
  ELEVENLABS: string;
  GLADIA: string;
  ASSEMBLYAI: string;
  REVAI: string;
  DEEPGRAM: string;
  LMNT: string;
  HUME: string;
  OPENROUTER: string;
  CHUTES: string;
  CUSTOM: string;
  LABELS: {
    openai: string;
    anthropic: string;
    google: string;
    groq: string;
    cohere: string;
    deepseek: string;
    mistral: string;
    amazon: string;
    azure: string;
    fireworks: string;
    togetherai: string;
    perplexity: string;
    deepinfra: string;
    xai: string;
    ollama: string;
    huggingface: string;
    cerebras: string;
    elevenlabs: string;
    gladia: string;
    assemblyai: string;
    revai: string;
    deepgram: string;
    lmnt: string;
    hume: string;
    openrouter: string;
    chutes: string;
    custom: string;
  };
}

/**
 * Image provider structure for API
 * @tsoaModel
 */
export interface ImageProviderConstants {
  OPENAI: string;
  STABILITY: string;
  MIDJOURNEY: string;
  LABELS: {
    openai: string;
    stability: string;
    midjourney: string;
  };
}

/**
 * HTTP status codes structure for API
 * @tsoaModel
 */
export interface HttpStatusConstants {
  OK: number;
  CREATED: number;
  BAD_REQUEST: number;
  UNAUTHORIZED: number;
  FORBIDDEN: number;
  NOT_FOUND: number;
  INTERNAL_SERVER_ERROR: number;
}

/**
 * Storage keys structure for API
 * @tsoaModel
 */
export interface StorageKeysConstants {
  AUTH_STORAGE: string;
  USER_PREFERENCES: string;
  THEME_MODE: string;
  AUTH_TOKEN: string;
  USER_PROFILE: string;
}

/**
 * Default values structure for API
 * @tsoaModel
 */
export interface DefaultsConstants {
  BOT: {
    SYSTEM_PROMPT: string;
    PERSONALITY: string;
    TRAITS: string[];
    LLM_PROVIDER: string;
    LLM_MODEL: string;
  };
}

/**
 * Environment variable names structure for API
 * @tsoaModel
 */
export interface EnvVarsConstants {
  API_URL: string;
  NODE_ENV: string;
  PORT: string;
  DB_PATH: string;
  JWT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_CALLBACK_URL: string;
}

/**
 * Discord API constants structure for API
 * @tsoaModel
 */
export interface DiscordApiConstants {
  BASE_URL: string;
  OAUTH2_URL: string;
  PERMISSIONS: {
    SEND_MESSAGES: string;
    VIEW_CHANNEL: string;
    READ_MESSAGE_HISTORY: string;
    ATTACH_FILES: string;
    EMBED_LINKS: string;
  };
  SCOPES: {
    BOT: string;
    APPLICATIONS_COMMANDS: string;
  };
  PERMISSION_INTEGERS: {
    BASIC_BOT: string;
  };
}

/**
 * Constants exported from common for frontend use
 * @tsoaModel
 */
export interface Constants {
  BOT_STATUS: BotStatusConstants;
  LLM_PROVIDER: LlmProviderConstants;
  IMAGE_PROVIDER: ImageProviderConstants;
  HTTP_STATUS: HttpStatusConstants;
  STORAGE_KEYS: StorageKeysConstants;
  DEFAULTS: DefaultsConstants;
  ENV_VARS: EnvVarsConstants;
  DISCORD_API: DiscordApiConstants;
}

/**
 * Response DTO for constants
 * @tsoaModel
 */
export interface ConstantsResponseDto {
  constants: Constants;
}
