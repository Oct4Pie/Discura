import fs from "fs/promises";
import path from "path";

import {
  LLMCompletionRequestDto,
  LLMCompletionResponseDto,
  LLMModelData,
  LLMProvider,
  LLMResponse,
  ProviderModelsResponseDto,
  AllProviderModelsResponseDto,
  ModelCapabilities,
  CustomProviderConfig as ApiCustomProviderConfig,
  ProviderRegistryConfiguration,
  CustomProviderConfig,
} from "@discura/common";

// Import specific types from Vercel AI SDK
import { generateText, type CoreMessage } from "ai";
import axios from "axios";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import {
  fetchOpenRouterModels,
  filterValidModels,
  groupModelsByProvider,
  mapOpenRouterProviderToLLMProvider,
  convertOpenRouterModelToEnhancedModel,
} from "./openrouter.service";
import {
  getAiProviderRegistry,
  refreshAiProviderRegistry,
  saveProviderConfig,
  convertToVercelAiModelId,
  parseVercelAiModelId,
} from "./vercel-ai-sdk.service";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { logger } from "../utils/logger";

// Cache settings - make these configurable via environment variables
const DEFAULT_CACHE_TTL = parseInt(
  process.env.MODEL_CACHE_TTL || "86400000",
  10
); // 24 hours in milliseconds by default
const OPENROUTER_CACHE_TTL = parseInt(
  process.env.OPENROUTER_CACHE_TTL || "43200000",
  10
); // 12 hours by default
const CACHE_FILE = path.join(
  process.cwd(),
  "data",
  "provider-models-cache.json"
);
const CACHE_RETRY_DELAY = parseInt(
  process.env.CACHE_RETRY_DELAY || "60000",
  10
); // 1 minute by default
const OPENROUTER_RATE_LIMIT_WAIT = parseInt(
  process.env.OPENROUTER_RATE_LIMIT_WAIT || "5000",
  10
); // 5 seconds

// Provider-specific cache TTLs in milliseconds
const PROVIDER_CACHE_TTL: Record<LLMProvider, number> = {
  [LLMProvider.OPENAI]: DEFAULT_CACHE_TTL,
  [LLMProvider.ANTHROPIC]: DEFAULT_CACHE_TTL,
  [LLMProvider.GOOGLE]: DEFAULT_CACHE_TTL,
  [LLMProvider.GROQ]: DEFAULT_CACHE_TTL,
  [LLMProvider.COHERE]: DEFAULT_CACHE_TTL,
  [LLMProvider.DEEPSEEK]: DEFAULT_CACHE_TTL,
  [LLMProvider.MISTRAL]: DEFAULT_CACHE_TTL,
  [LLMProvider.AMAZON]: DEFAULT_CACHE_TTL,
  [LLMProvider.AZURE]: DEFAULT_CACHE_TTL,
  [LLMProvider.FIREWORKS]: DEFAULT_CACHE_TTL,
  [LLMProvider.TOGETHERAI]: DEFAULT_CACHE_TTL,
  [LLMProvider.PERPLEXITY]: DEFAULT_CACHE_TTL,
  [LLMProvider.DEEPINFRA]: DEFAULT_CACHE_TTL,
  [LLMProvider.XAI]: DEFAULT_CACHE_TTL,
  [LLMProvider.OLLAMA]: DEFAULT_CACHE_TTL,
  [LLMProvider.HUGGINGFACE]: DEFAULT_CACHE_TTL,
  [LLMProvider.CEREBRAS]: DEFAULT_CACHE_TTL,
  [LLMProvider.ELEVENLABS]: DEFAULT_CACHE_TTL,
  [LLMProvider.GLADIA]: DEFAULT_CACHE_TTL,
  [LLMProvider.ASSEMBLYAI]: DEFAULT_CACHE_TTL,
  [LLMProvider.REVAI]: DEFAULT_CACHE_TTL,
  [LLMProvider.DEEPGRAM]: DEFAULT_CACHE_TTL,
  [LLMProvider.LMNT]: DEFAULT_CACHE_TTL,
  [LLMProvider.HUME]: DEFAULT_CACHE_TTL,
  [LLMProvider.OPENROUTER]: OPENROUTER_CACHE_TTL, // Use OpenRouter-specific TTL
  [LLMProvider.CUSTOM]: DEFAULT_CACHE_TTL,
};

// Provider display names mapping
const PROVIDER_DISPLAY_NAMES: Record<LLMProvider, string> = {
  [LLMProvider.OPENAI]: "OpenAI",
  [LLMProvider.ANTHROPIC]: "Anthropic",
  [LLMProvider.GOOGLE]: "Google AI",
  [LLMProvider.GROQ]: "Groq",
  [LLMProvider.COHERE]: "Cohere",
  [LLMProvider.DEEPSEEK]: "DeepSeek",
  [LLMProvider.MISTRAL]: "Mistral AI",
  [LLMProvider.AMAZON]: "Amazon Bedrock",
  [LLMProvider.AZURE]: "Azure OpenAI",
  [LLMProvider.FIREWORKS]: "Fireworks AI",
  [LLMProvider.TOGETHERAI]: "Together AI",
  [LLMProvider.PERPLEXITY]: "Perplexity",
  [LLMProvider.DEEPINFRA]: "DeepInfra",
  [LLMProvider.XAI]: "xAI Grok",
  [LLMProvider.OLLAMA]: "Ollama",
  [LLMProvider.HUGGINGFACE]: "Hugging Face",
  [LLMProvider.CEREBRAS]: "Cerebras",
  [LLMProvider.ELEVENLABS]: "ElevenLabs",
  [LLMProvider.GLADIA]: "Gladia",
  [LLMProvider.ASSEMBLYAI]: "AssemblyAI",
  [LLMProvider.REVAI]: "Rev.ai",
  [LLMProvider.DEEPGRAM]: "Deepgram",
  [LLMProvider.LMNT]: "LMNT",
  [LLMProvider.HUME]: "Hume",
  [LLMProvider.OPENROUTER]: "OpenRouter",
  [LLMProvider.CUSTOM]: "Custom API",
};

// Default models by provider - These will be used as fallbacks when OpenRouter data is unavailable
const DEFAULT_PROVIDER_MODELS: Record<LLMProvider, LLMModelData[]> = {
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
  [LLMProvider.GROQ]: [
    {
      id: "llama3-70b-8192",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 10,
      owned_by: "groq",
      display_name: "Llama3 70B",
      provider_model_id: "llama3-70b-8192",
      context_length: 8192,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.COHERE]: [
    {
      id: "command-r-plus",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 20,
      owned_by: "cohere",
      display_name: "Command R+",
      provider_model_id: "command-r-plus",
      context_length: 128000,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.DEEPSEEK]: [
    {
      id: "deepseek-coder",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      owned_by: "deepseek",
      display_name: "DeepSeek Coder",
      provider_model_id: "deepseek-coder",
      context_length: 32768,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.MISTRAL]: [
    {
      id: "mistral-medium-latest",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 10,
      owned_by: "mistral",
      display_name: "Mistral Medium (Latest)",
      provider_model_id: "mistral-medium-latest",
      context_length: 32768,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.AMAZON]: [
    {
      id: "anthropic.claude-3-sonnet-20240229-v1:0",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 15,
      owned_by: "amazon",
      display_name: "Claude 3 Sonnet (Amazon Bedrock)",
      provider_model_id: "anthropic.claude-3-sonnet-20240229-v1:0",
      context_length: 200000,
      capabilities: {
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        supports_streaming: true,
        supports_vision: true,
      },
    },
  ],
  [LLMProvider.AZURE]: [
    {
      id: "gpt-4",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 20,
      owned_by: "azure",
      display_name: "GPT-4 (Azure)",
      provider_model_id: "gpt-4",
      context_length: 128000,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.FIREWORKS]: [
    {
      id: "llama-v3-70b-instruct",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 10,
      owned_by: "fireworks",
      display_name: "Llama 3 70B Instruct",
      provider_model_id: "llama-v3-70b-instruct",
      context_length: 8192,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.TOGETHERAI]: [
    {
      id: "mistralai/mixtral-8x7b-instruct-v0.1",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 60,
      owned_by: "togetherai",
      display_name: "Mixtral 8x7B Instruct",
      provider_model_id: "mistralai/mixtral-8x7b-instruct-v0.1",
      context_length: 32768,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.PERPLEXITY]: [
    {
      id: "sonar-medium-online",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      owned_by: "perplexity",
      display_name: "Sonar Medium Online",
      provider_model_id: "sonar-medium-online",
      context_length: 12000,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.DEEPINFRA]: [
    {
      id: "meta-llama/llama-3-70b-instruct",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 15,
      owned_by: "deepinfra",
      display_name: "Llama 3 70B Instruct",
      provider_model_id: "meta-llama/llama-3-70b-instruct",
      context_length: 8192,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.XAI]: [
    {
      id: "grok-1",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 45,
      owned_by: "xai",
      display_name: "Grok-1",
      provider_model_id: "grok-1",
      context_length: 8192,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.OLLAMA]: [
    {
      id: "llama3",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 10,
      owned_by: "ollama",
      display_name: "Llama 3",
      provider_model_id: "llama3",
      context_length: 8192,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.HUGGINGFACE]: [
    {
      id: "meta-llama/llama-3-8b-instruct",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 15,
      owned_by: "huggingface",
      display_name: "Llama 3 8B Instruct",
      provider_model_id: "meta-llama/llama-3-8b-instruct",
      context_length: 8192,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.CEREBRAS]: [
    {
      id: "cerebras-gpt",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 120,
      owned_by: "cerebras",
      display_name: "Cerebras-GPT",
      provider_model_id: "cerebras-gpt",
      context_length: 4096,
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.ELEVENLABS]: [
    {
      id: "eleven-multilingual-v2",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      owned_by: "elevenlabs",
      display_name: "Eleven Multilingual V2",
      provider_model_id: "eleven-multilingual-v2",
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["audio"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.GLADIA]: [
    {
      id: "transcription",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 45,
      owned_by: "gladia",
      display_name: "Transcription",
      provider_model_id: "transcription",
      capabilities: {
        input_modalities: ["audio"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.ASSEMBLYAI]: [
    {
      id: "assemblyai-transcribe",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 60,
      owned_by: "assemblyai",
      display_name: "AssemblyAI Transcribe",
      provider_model_id: "assemblyai-transcribe",
      capabilities: {
        input_modalities: ["audio"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.REVAI]: [
    {
      id: "revai-transcribe",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 60,
      owned_by: "revai",
      display_name: "Rev.ai Transcribe",
      provider_model_id: "revai-transcribe",
      capabilities: {
        input_modalities: ["audio"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.DEEPGRAM]: [
    {
      id: "nova-2",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      owned_by: "deepgram",
      display_name: "Nova 2",
      provider_model_id: "nova-2",
      capabilities: {
        input_modalities: ["audio"],
        output_modalities: ["text"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.LMNT]: [
    {
      id: "lmnt-tts",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 45,
      owned_by: "lmnt",
      display_name: "LMNT Text-to-Speech",
      provider_model_id: "lmnt-tts",
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["audio"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.HUME]: [
    {
      id: "hume-tts",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      owned_by: "hume",
      display_name: "Hume Text-to-Speech",
      provider_model_id: "hume-tts",
      capabilities: {
        input_modalities: ["text"],
        output_modalities: ["audio"],
        supports_streaming: true,
      },
    },
  ],
  [LLMProvider.OPENROUTER]: [
    {
      id: "openrouter/auto",
      object: "model",
      created: Math.floor(Date.now() / 1000) - 86400 * 5,
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
  ],
  [LLMProvider.CUSTOM]: [],
};

// Default models to show when no provider is available
const DEFAULT_MODELS: LLMModelData[] = [
  {
    id: "gpt-3.5-turbo",
    object: "model",
    created: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    owned_by: "openai",
    display_name: "GPT-3.5 Turbo", // Added required property
    provider_model_id: "gpt-3.5-turbo", // Added required property
  },
];

// Model cache
interface ModelCache {
  timestamp: number;
  openRouterLastFetch: number; // Track when we last hit the OpenRouter API
  providers: Record<LLMProvider, ProviderModelsResponseDto>;
}

let modelCache: ModelCache | null = null;
let openRouterRateLimitHit = false;
let openRouterLastRequest = 0;

/**
 * Load the provider configuration from file
 */
async function loadProviderConfig(): Promise<ProviderRegistryConfiguration> {
  try {
    // Check if config file exists, otherwise create default
    const configPath = path.join(process.cwd(), "..", "provider-config.json");

    try {
      const configData = await fs.readFile(configPath, "utf-8");
      return JSON.parse(configData) as ProviderRegistryConfiguration;
    } catch (error) {
      // Create default config if file doesn't exist
      const defaultConfig: ProviderRegistryConfiguration = {
        providers: Object.values(LLMProvider).reduce(
          (acc, provider) => {
            acc[provider] = {
              enabled: provider !== LLMProvider.CUSTOM, // All enabled by default except custom
            };
            return acc;
          },
          {} as Record<LLMProvider, { enabled: boolean }>
        ),
      };

      // Ensure the directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });

      // Write default config
      await fs.writeFile(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        "utf-8"
      );

      return defaultConfig;
    }
  } catch (error) {
    logger.error("Error loading provider config:", error);

    // Return a default config if there's an error
    return {
      providers: Object.values(LLMProvider).reduce(
        (acc, provider) => {
          acc[provider] = { enabled: provider !== LLMProvider.CUSTOM };
          return acc;
        },
        {} as Record<LLMProvider, { enabled: boolean }>
      ),
    };
  }
}

/**
 * Load models from cache file if it exists
 */
async function loadModelCache(): Promise<void> {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    const parsedCache = JSON.parse(data);

    if (
      parsedCache &&
      typeof parsedCache === "object" &&
      parsedCache.models && // Check for the OpenRouter-style structure first
      Array.isArray(parsedCache.models.data) &&
      typeof parsedCache.timestamp === "number"
    ) {
      logger.info(
        "Processing OpenRouter-style model cache file (models.data found)."
      );
      const rawModels: any[] = parsedCache.models.data;
      const cacheTimestamp = parsedCache.timestamp;

      const validModels = filterValidModels(rawModels);
      const modelsByProviderName = groupModelsByProvider(validModels);

      const newProviders: Record<LLMProvider, ProviderModelsResponseDto> =
        {} as Record<LLMProvider, ProviderModelsResponseDto>;

      for (const [providerName, modelsInGroup] of Object.entries(
        modelsByProviderName
      )) {
        const llmProviderEnum =
          mapOpenRouterProviderToLLMProvider(providerName);
        if (llmProviderEnum) {
          const enhancedModels = modelsInGroup.map(
            convertOpenRouterModelToEnhancedModel
          );
          newProviders[llmProviderEnum] = {
            provider: llmProviderEnum,
            provider_display_name:
              PROVIDER_DISPLAY_NAMES[llmProviderEnum] || providerName,
            models: enhancedModels,
            last_updated: cacheTimestamp,
          };
        } else {
          logger.warn(
            `Could not map OpenRouter provider name "${providerName}" to an LLMProvider enum. Skipping these models.`
          );
        }
      }

      modelCache = {
        timestamp: cacheTimestamp,
        openRouterLastFetch: cacheTimestamp, // Assume this cache is from an OpenRouter fetch
        providers: newProviders,
      };
      logger.info(
        "Successfully processed and loaded OpenRouter-style model cache."
      );
    } else if (
      // Fallback to existing logic for provider-centric cache
      parsedCache &&
      typeof parsedCache === "object" &&
      typeof parsedCache.timestamp === "number" &&
      typeof parsedCache.providers === "object" &&
      parsedCache.providers !== null
    ) {
      modelCache = parsedCache as ModelCache;
      if (typeof modelCache.openRouterLastFetch !== "number") {
        modelCache.openRouterLastFetch = 0; // Default if missing
      }
      logger.info("Loaded provider-centric model cache from file.");
    } else {
      logger.warn(
        "Model cache file found but has unrecognized or invalid structure. Discarding and will create a new one."
      );
      modelCache = null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.info(
      `No valid model cache file found or error during processing (error: ${errorMessage}). Will create a new one.`
    );
    modelCache = null;
  }
}

/**
 * Save the model cache to file
 */
async function saveModelCache(): Promise<void> {
  try {
    if (!modelCache) return;

    // Ensure the directory exists
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });

    await fs.writeFile(
      CACHE_FILE,
      JSON.stringify(modelCache, null, 2),
      "utf-8"
    );
    logger.info("Model cache saved to file");
  } catch (error) {
    logger.error("Error saving model cache:", error);
  }
}

/**
 * Initialize the model cache on startup
 */
async function initializeModelCache(): Promise<void> {
  try {
    await loadModelCache(); // Sets modelCache to null if issues with the file or missing 'providers'

    let cacheNeedsSaving = false;

    if (!modelCache) {
      logger.info(
        "No existing cache or invalid cache structure loaded. Initializing a new model cache."
      );
      modelCache = {
        timestamp: Date.now(),
        openRouterLastFetch: 0,
        providers: {} as Record<LLMProvider, ProviderModelsResponseDto>,
      };
      // A new cache might need saving if providers are added, handled below.
    } else {
      // Cache was loaded, but ensure 'providers' object and 'openRouterLastFetch' exist and are correct type.
      // This handles cases where the cache file might be from an old version, an external script,
      // or a previous save that didn't include the full structure.
      if (
        typeof modelCache.providers !== "object" ||
        modelCache.providers === null
      ) {
        logger.warn(
          "Loaded model cache is missing 'providers' object or it's not an object. Initializing 'providers' field."
        );
        modelCache.providers = {} as Record<
          LLMProvider,
          ProviderModelsResponseDto
        >;
        cacheNeedsSaving = true; // Cache structure was modified
      }
      if (typeof modelCache.openRouterLastFetch !== "number") {
        logger.warn(
          "Loaded model cache is missing 'openRouterLastFetch' or it's not a number. Initializing 'openRouterLastFetch'."
        );
        modelCache.openRouterLastFetch = 0;
        cacheNeedsSaving = true; // Cache structure was modified
      }
    }

    // At this point, modelCache is guaranteed to be non-null,
    // and modelCache.providers is guaranteed to be an object.
    const config = await loadProviderConfig();

    Object.values(LLMProvider).forEach((provider) => {
      if (config.providers[provider]?.enabled) {
        if (!modelCache!.providers[provider]) {
          logger.info(`Initializing entry for provider ${provider} in cache.`);
          modelCache!.providers[provider] = {
            provider,
            provider_display_name: PROVIDER_DISPLAY_NAMES[provider],
            models: DEFAULT_PROVIDER_MODELS[provider] || [],
            last_updated: 0, // Force immediate fetch
          };
          cacheNeedsSaving = true;
        }
      }
    });

    if (cacheNeedsSaving) {
      logger.info("Saving updated model cache after initialization.");
      await saveModelCache();
    }
  } catch (error) {
    logger.error("Error initializing model cache:", error);
    // Fallback: ensure modelCache is at least minimally valid to prevent cascading errors
    if (
      !modelCache ||
      typeof modelCache.providers !== "object" ||
      modelCache.providers === null
    ) {
      modelCache = {
        timestamp: Date.now(),
        openRouterLastFetch: 0,
        providers: {} as Record<LLMProvider, ProviderModelsResponseDto>,
      };
      logger.info(
        "Fallback: Re-initialized modelCache due to critical error during initialization."
      );
    }
  }
}

// Initialize cache on module load
initializeModelCache().catch((error) => {
  logger.error("Failed to initialize model cache:", error);
});

/**
 * Check if the cache for a provider is expired
 */
function isCacheExpired(provider: LLMProvider): boolean {
  if (!modelCache || !modelCache.providers[provider]) return true;

  const now = Date.now();
  const lastUpdated = modelCache.providers[provider].last_updated;
  const ttl = PROVIDER_CACHE_TTL[provider] || DEFAULT_CACHE_TTL;

  return now - lastUpdated > ttl;
}

/**
 * Check if we should throttle OpenRouter API requests
 * This implements a simple rate limiting mechanism to avoid hitting OpenRouter's limits
 */
function shouldThrottleOpenRouter(): boolean {
  const now = Date.now();

  // If we hit a rate limit recently, enforce a cool-down period
  if (
    openRouterRateLimitHit &&
    now - openRouterLastRequest < OPENROUTER_RATE_LIMIT_WAIT * 10
  ) {
    return true;
  }

  // Basic rate limiting - don't make requests too close together
  if (now - openRouterLastRequest < OPENROUTER_RATE_LIMIT_WAIT) {
    return true;
  }

  // If we fetched models from OpenRouter recently, use the cache
  if (
    modelCache?.openRouterLastFetch &&
    now - modelCache.openRouterLastFetch < OPENROUTER_CACHE_TTL
  ) {
    return true;
  }

  return false;
}

/**
 * Fetch models from OpenRouter API and map them to our provider structure
 * With rate limiting and backoff strategy
 */
async function fetchModelsFromOpenRouter(): Promise<
  Record<LLMProvider, LLMModelData[]>
> {
  try {
    // Check if we should throttle requests to OpenRouter
    if (shouldThrottleOpenRouter()) {
      logger.info("Using cached OpenRouter data due to rate limiting");
      // Return empty result to trigger fallback to cached models
      const emptyResult = {} as Record<LLMProvider, LLMModelData[]>;
      Object.values(LLMProvider).forEach((provider) => {
        emptyResult[provider] = [];
      });
      return emptyResult;
    }

    // Fetch models from OpenRouter
    const openRouterModelsResponse = await fetchOpenRouterModels(); // This is from openrouter.service

    logger.info(
      `Received ${Array.isArray(openRouterModelsResponse) ? openRouterModelsResponse.length : "non-array"} OpenRouter models response`
    );

    // Safety check - if we didn't get any models, return empty result
    if (!openRouterModelsResponse || openRouterModelsResponse.length === 0) {
      logger.warn("OpenRouter returned empty or invalid models array");
      const emptyResult = {} as Record<LLMProvider, LLMModelData[]>;
      Object.values(LLMProvider).forEach((provider) => {
        emptyResult[provider] = [];
      });
      return emptyResult;
    }

    const currentFetchTimestamp = Date.now(); // Timestamp of this successful fetch

    // Update the last successful fetch timestamp in cache
    if (modelCache) {
      modelCache.openRouterLastFetch = currentFetchTimestamp;
    }

    // Reset rate limit flag since request was successful
    openRouterRateLimitHit = false;

    // Filter out any hidden or disabled models
    const validModels = filterValidModels(openRouterModelsResponse);

    // Group models by provider name from the endpoint.provider_name field
    const modelsByProviderName = groupModelsByProvider(validModels);

    // Create a mapping from our LLMProvider enum to lists of models
    const groupedResult: Record<LLMProvider, LLMModelData[]> = {} as Record<
      LLMProvider,
      LLMModelData[]
    >;

    // Initialize result with empty arrays for all providers to prevent undefined errors
    Object.values(LLMProvider).forEach((provider) => {
      groupedResult[provider] = [];
    });

    // Populate with actual models where available
    Object.entries(modelsByProviderName).forEach(([providerName, models]) => {
      // Map the provider name to our LLMProvider enum
      const providerEnum = mapOpenRouterProviderToLLMProvider(providerName);

      logger.debug(
        `Mapping provider ${providerName} to internal provider ${providerEnum}`
      );

      if (providerEnum) {
        // Ensure providerEnum is valid before using as key
        // Convert OpenRouter models to our LLMModelData format
        const enhancedModels = models.map(
          convertOpenRouterModelToEnhancedModel
        );

        // Add to our result - this ensures we have an array even if empty
        groupedResult[providerEnum] = [
          ...(groupedResult[providerEnum] || []),
          ...enhancedModels,
        ];
      } else {
        logger.warn(
          `Could not map provider name \"${providerName}\" from OpenRouter to a known LLMProvider. These models will be skipped.`
        );
      }
    });

    // Update modelCache with all fetched provider data from this successful API call
    if (modelCache) {
      // modelCache.openRouterLastFetch is already set to currentFetchTimestamp

      Object.entries(groupedResult).forEach(([providerStr, modelsInGroup]) => {
        const providerKey = providerStr as LLMProvider; // String enum key to enum type
        const displayName = PROVIDER_DISPLAY_NAMES[providerKey] || providerKey;

        // Update the provider's entry with the models fetched (or an empty array if none)
        // and set its last_updated to the current fetch's timestamp.
        modelCache!.providers[providerKey] = {
          provider: providerKey,
          provider_display_name: displayName,
          models: modelsInGroup,
          last_updated: currentFetchTimestamp,
        };
      });

      modelCache.timestamp = currentFetchTimestamp; // Update overall cache timestamp
      await saveModelCache(); // Save all accumulated changes to the cache
      logger.info(
        "Updated model cache with fresh data from OpenRouter for all relevant providers."
      );
    }

    return groupedResult;
  } catch (error) {
    logger.error("Error fetching models from OpenRouter:", error);

    // Check if this might be a rate limit issue
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      logger.warn("OpenRouter rate limit hit, implementing cool-down period");
      openRouterRateLimitHit = true;
    }

    // Return a properly structured empty result
    const emptyResult = {} as Record<LLMProvider, LLMModelData[]>;
    Object.values(LLMProvider).forEach((provider) => {
      emptyResult[provider] = [];
    });

    return emptyResult;
  }
}

/**
 * Fetch models from a provider API and update the cache
 */
async function fetchProviderModels(
  provider: LLMProvider
): Promise<ProviderModelsResponseDto> {
  try {
    // Get enabled providers
    const config = await loadProviderConfig();

    // Check if OpenRouter integration is enabled
    const useOpenRouter = process.env.USE_OPENROUTER === "true";

    let models: LLMModelData[] = [];
    const providerDisplayName = PROVIDER_DISPLAY_NAMES[provider];

    // If the provider is CUSTOM, handle it separately
    if (
      provider === LLMProvider.CUSTOM &&
      config.providers[provider]?.custom_providers
    ) {
      // Combine models from all custom providers
      models = config.providers[provider].custom_providers.flatMap(
        (customProvider: CustomProviderConfig) => customProvider.models
      );
    }
    // Special handling for OpenRouter provider - always use direct OpenRouter service
    else if (provider === LLMProvider.OPENROUTER) {
      try {
        // Fetch models directly from OpenRouter public API (no auth required)
        const openRouterModels = await fetchOpenRouterModels();

        if (openRouterModels && openRouterModels.length > 0) {
          // Add special routing endpoints as the first models
          const routingEndpoints: LLMModelData[] = [
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

          // Filter the models to just get valid ones for display
          const validModels = filterValidModels(openRouterModels);

          // Convert from OpenRouter format to our LLMModelData format
          const enhancedModels = validModels.map(
            convertOpenRouterModelToEnhancedModel
          );

          // Combine routing endpoints with regular models
          models = [...routingEndpoints, ...enhancedModels];

          logger.info(
            `Fetched ${models.length} models from OpenRouter API (${enhancedModels.length} regular models plus 4 routing endpoints)`
          );
        } else {
          // If we didn't get any models, fall back to defaults
          models = DEFAULT_PROVIDER_MODELS[provider] || [];
          logger.warn("OpenRouter returned no models, using defaults");
        }
      } catch (error) {
        logger.error("Error fetching OpenRouter models:", error);
        models = DEFAULT_PROVIDER_MODELS[provider] || [];
      }
    }
    // Use OpenRouter if enabled for getting all provider models
    else if (useOpenRouter) {
      try {
        // Fetch all models from OpenRouter (already grouped by LLMProvider and converted to LLMModelData)
        const allGroupedModels = await fetchModelsFromOpenRouter();

        if (
          allGroupedModels &&
          allGroupedModels[provider] &&
          allGroupedModels[provider].length > 0
        ) {
          models = allGroupedModels[provider];
          logger.info(
            `Found ${models.length} models for provider ${provider} from OpenRouter data`
          );
        } else {
          // If no models found for this specific provider in the OpenRouter data,
          // or if allGroupedModels is empty/null, or if the specific provider array is empty.
          logger.info(
            `No models for provider ${provider} found in OpenRouter data, or OpenRouter data itself is empty/missing this provider.`
          );
          if (modelCache?.providers[provider]?.models.length) {
            logger.info(`Falling back to cached models for ${provider}`);
            models = modelCache.providers[provider].models;
          } else {
            logger.info(`Falling back to default models for ${provider}`);
            models = DEFAULT_PROVIDER_MODELS[provider] || [];
          }
        }
      } catch (error) {
        logger.error(
          `Error fetching or processing ${provider} models via OpenRouter:`,
          error
        );

        // Fallback logic in case of error during fetch/processing
        if (modelCache?.providers[provider]?.models.length) {
          logger.info(
            `Using cached models for ${provider} due to OpenRouter fetch/processing error`
          );
          models = modelCache.providers[provider].models;
        } else {
          logger.info(
            `Using default models for ${provider} due to OpenRouter fetch/processing error and no cache`
          );
          models = DEFAULT_PROVIDER_MODELS[provider] || [];
        }
      }
    }
    // Use default models if OpenRouter is disabled
    else {
      models = DEFAULT_PROVIDER_MODELS[provider] || [];
    }

    const result: ProviderModelsResponseDto = {
      provider,
      provider_display_name: providerDisplayName,
      models,
      last_updated: Date.now(),
    };

    // Update the cache
    if (!modelCache) {
      modelCache = {
        timestamp: Date.now(),
        openRouterLastFetch: useOpenRouter ? Date.now() : 0,
        providers: {} as Record<LLMProvider, ProviderModelsResponseDto>,
      };
    }

    // Now we're sure modelCache is not null
    modelCache.providers[provider] = result;
    await saveModelCache();

    return result;
  } catch (error) {
    logger.error(`Error fetching models for provider ${provider}:`, error);

    // Return cached models if available, otherwise use defaults
    const cachedModels = modelCache?.providers?.[provider]?.models || [];
    const defaultModels = DEFAULT_PROVIDER_MODELS[provider] || [];
    const fallbackModels =
      cachedModels.length > 0 ? cachedModels : defaultModels;

    return {
      provider,
      provider_display_name: PROVIDER_DISPLAY_NAMES[provider],
      models: fallbackModels,
      last_updated: Date.now(),
    };
  }
}

/**
 * Fetch available LLM models from the appropriate provider
 */
export const listModels = async (): Promise<LLMModelData[]> => {
  try {
    // Get models from all providers and flatten them
    const allProviders = await getAllProviderModels();
    const allModels: LLMModelData[] = allProviders.providers.flatMap(
      (provider) => provider.models
    );

    // Sort by creation date (newest first)
    allModels.sort((a, b) => b.created - a.created);

    return allModels.length ? allModels : DEFAULT_MODELS;
  } catch (error) {
    logger.error("Error fetching LLM models:", error);
    return DEFAULT_MODELS; // Fall back to default models
  }
};

/**
 * Get models for a specific provider, with caching
 */
export const getProviderModels = async (
  provider: LLMProvider
): Promise<ProviderModelsResponseDto> => {
  // Check if the provider exists in enum
  if (!Object.values(LLMProvider).includes(provider)) {
    throw new Error(`Invalid provider: ${provider}`);
  }

  try {
    // Check if we need to fetch fresh data
    if (
      !modelCache ||
      !modelCache.providers[provider] ||
      isCacheExpired(provider)
    ) {
      return await fetchProviderModels(provider);
    }

    // Return cached data
    return modelCache.providers[provider];
  } catch (error) {
    logger.error(`Error getting models for provider ${provider}:`, error);

    // Return a fallback response with default models rather than throwing
    return {
      provider,
      provider_display_name: PROVIDER_DISPLAY_NAMES[provider],
      models: DEFAULT_PROVIDER_MODELS[provider] || [],
      last_updated: Date.now(),
    };
  }
};

/**
 * Get models for all available providers, with caching
 */
export const getAllProviderModels =
  async (): Promise<AllProviderModelsResponseDto> => {
    try {
      // Load provider config to get enabled providers
      const config = await loadProviderConfig();
      const enabledProviders = Object.entries(config.providers)
        .filter(([_, config]) => config.enabled)
        .map(([provider]) => provider as LLMProvider);

      // Fetch models for all enabled providers
      const providerModelsPromises = enabledProviders.map((provider) =>
        getProviderModels(provider).catch((error) => {
          // Log the error but return a fallback response for this provider
          logger.error(
            `Error getting models for provider ${provider} in getAllProviderModels:`,
            error
          );
          return {
            provider,
            provider_display_name: PROVIDER_DISPLAY_NAMES[provider],
            models: DEFAULT_PROVIDER_MODELS[provider] || [],
            last_updated: Date.now(),
          };
        })
      );

      const providerModels = await Promise.all(providerModelsPromises);

      return {
        providers: providerModels,
      };
    } catch (error) {
      logger.error("Error getting all provider models:", error);

      // Return fallback data with default models for each provider
      const fallbackProviders = Object.values(LLMProvider).map((provider) => ({
        provider,
        provider_display_name: PROVIDER_DISPLAY_NAMES[provider],
        models: DEFAULT_PROVIDER_MODELS[provider] || [],
        last_updated: Date.now(),
      }));

      return {
        providers: fallbackProviders,
      };
    }
  };

/**
 * Force refresh models for a provider
 */
export const refreshProviderModels = async (
  provider: LLMProvider
): Promise<ProviderModelsResponseDto> => {
  try {
    // Force a refresh by fetching new data
    const result = await fetchProviderModels(provider);

    logger.info(`Refreshed models for provider ${provider}`);

    return result;
  } catch (error) {
    logger.error(`Error refreshing models for provider ${provider}:`, error);
    throw error;
  }
};

/**
 * Create a chat completion using Vercel AI SDK
 * This offers more flexibility and better integration with various providers
 */
export const createChatCompletionWithVercelAi = async (
  request: LLMCompletionRequestDto,
  userId: string
): Promise<LLMCompletionResponseDto> => {
  try {
    logger.info(
      `Creating chat completion with Vercel AI SDK using model: ${request.model}`
    );

    // Get the provider registry
    const registry = await getAiProviderRegistry();

    // Parse the request model to get provider and model ID
    let providerName: string;
    let modelId: string;

    // If the model ID contains our separator, it's already in Vercel AI format
    if (request.model.includes(" > ")) {
      const parsed = parseVercelAiModelId(request.model);
      providerName = parsed.provider;
      modelId = parsed.modelId;
    }
    // Special handling for OpenRouter models with model_variant_slug
    else if (
      request.model.includes("/") &&
      !request.model.startsWith("gpt-") &&
      !request.model.startsWith("claude-") &&
      !request.model.startsWith("gemini-")
    ) {
      // This looks like an OpenRouter model slug
      try {
        // Try to get the model_variant_slug from OpenRouter
        const variantSlug = await getModelVariantSlug(request.model);
        if (variantSlug) {
          providerName = "openrouter";
          modelId = variantSlug;
          logger.info(`Mapped to OpenRouter variant slug: ${variantSlug}`);
        } else {
          // Fall back to using the model as is with OpenRouter
          providerName = "openrouter";
          modelId = request.model;
          logger.info(
            `No variant slug found, using model ID directly with OpenRouter: ${request.model}`
          );
        }
      } catch (error) {
        // If there's an error getting the variant slug, use the default mapping
        logger.warn(
          `Error getting OpenRouter variant slug: ${error}. Using default mapping.`
        );
        const parts = request.model.split("/");
        providerName = parts[0].toLowerCase();
        modelId = parts.slice(1).join("/");
      }
    } else {
      // Try to determine provider from model ID based on naming conventions
      if (
        request.model.startsWith("gpt-") ||
        request.model.includes("dall-e")
      ) {
        providerName = "openai";
        modelId = request.model;
      } else if (request.model.startsWith("claude-")) {
        providerName = "anthropic";
        modelId = request.model;
      } else if (
        request.model.startsWith("gemini-") ||
        request.model.startsWith("models/gemini-")
      ) {
        providerName = "google";
        modelId = request.model;
      } else {
        // For other providers, use the model as is and let the registry route it
        const [provider, ...modelParts] = request.model.split("/");
        providerName = provider.toLowerCase();
        modelId = modelParts.join("/") || request.model;
      }
    }

    logger.info(`Mapped to provider: ${providerName}, model: ${modelId}`);

    // For OpenRouter, use different selection methods based on special routing endpoints
    if (
      providerName === "openrouter" &&
      ["auto", "best", "fastest", "cheapest"].includes(modelId)
    ) {
      // These are special OpenRouter routing endpoints, use them directly
      logger.info(`Using OpenRouter routing endpoint: ${modelId}`);
      // Use chat() for all models since OpenRouter supports it widely
      const model = registry.openrouter.chat(modelId);

      // Prepare messages for Vercel AI SDK - convert to CoreMessage format
      const messages: CoreMessage[] = request.messages.map((msg) => ({
        role:
          msg.role === "user"
            ? "user"
            : msg.role === "assistant"
              ? "assistant"
              : msg.role === "system"
                ? "system"
                : "user",
        content: msg.content,
        name: msg.name,
      }));

      const startTime = Date.now();

      // Generate text using Vercel AI SDK
      const result = await generateText({
        model,
        messages,
        temperature: request.temperature,
        topP: request.top_p,
        maxTokens: request.max_tokens,
        presencePenalty: request.presence_penalty,
        frequencyPenalty: request.frequency_penalty,
      });

      const endTime = Date.now();

      // Calculate token usage (rough estimate)
      const promptTokens = messages.reduce(
        (acc, msg) => acc + calculateTokenCount(msg.content),
        0
      );
      const completionTokens = calculateTokenCount(result.text);

      // Return in OpenAI-compatible format
      return {
        id: `openrouter-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: result.text,
            },
            finish_reason: "stop", // Assuming normal completion
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        },
      };
    }
    // For standard models that use the provider registry
    else {
      // Prepare the model reference for Vercel AI
      const model = registry.languageModel(`${providerName} > ${modelId}`);

      // Map our request format to Vercel AI SDK format
      const messages: CoreMessage[] = request.messages.map((msg) => ({
        role:
          msg.role === "user"
            ? "user"
            : msg.role === "assistant"
              ? "assistant"
              : msg.role === "system"
                ? "system"
                : "user",
        content: msg.content,
        name: msg.name,
      }));

      const startTime = Date.now();

      // Generate text using Vercel AI SDK
      const result = await generateText({
        model,
        messages,
        temperature: request.temperature,
        topP: request.top_p,
        maxTokens: request.max_tokens,
        presencePenalty: request.presence_penalty,
        frequencyPenalty: request.frequency_penalty,
      });

      const endTime = Date.now();

      // Rough estimation of token counts
      // In a production app, you would use a proper tokenizer
      const promptTokens = messages.reduce(
        (acc, msg) => acc + calculateTokenCount(msg.content),
        0
      );
      const completionTokens = calculateTokenCount(result.text);

      // Map Vercel AI response to our API format
      const response: LLMCompletionResponseDto = {
        id: `discura-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: result.text,
            },
            finish_reason: "stop", // Assuming normal completion
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        },
      };

      logger.info(
        `Completion generated with Vercel AI SDK in ${endTime - startTime}ms`
      );

      return response;
    }
  } catch (error) {
    logger.error("Error in createChatCompletionWithVercelAi:", error);

    // Re-throw as a structured error for the API
    throw new Error(
      `Failed to generate completion: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Create a chat completion using the selected model
 */
export const createChatCompletion = async (
  request: LLMCompletionRequestDto,
  userId: string
): Promise<LLMCompletionResponseDto> => {
  try {
    // First, try to use Vercel AI SDK if available
    try {
      return await createChatCompletionWithVercelAi(request, userId);
    } catch (vercelError) {
      logger.warn(
        `Vercel AI SDK completion failed, falling back to direct API: ${vercelError instanceof Error ? vercelError.message : "Unknown error"}`
      );

      // Fall back to existing implementation
      // Get API key based on user or bot configuration
      const apiKey = await getApiKeyForUser(userId, request.model);

      if (apiKey) {
        // Determine provider from model and use appropriate API
        if (request.model.startsWith("gpt-")) {
          return callOpenAIDirectly(request, apiKey);
        } else if (request.model.startsWith("claude-")) {
          return callAnthropicDirectly(request, apiKey);
        } else if (request.model.startsWith("gemini-")) {
          return callGoogleDirectly(request, apiKey);
        } else {
          // For other providers, fallback to generic handling
          return callGenericProviderDirectly(request, apiKey);
        }
      }
    }

    // If we can't get an API key or the provider is unknown, simulate a response
    logger.info("Using simulated response for demonstration");
    const completionText = generateSimulatedResponse(request.messages);

    return {
      id: `chatcmpl-${uuidv4().substring(0, 8)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: completionText,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: request.messages.reduce(
          (total, msg) => total + calculateTokenCount(msg.content),
          0
        ),
        completion_tokens: calculateTokenCount(completionText),
        total_tokens:
          request.messages.reduce(
            (total, msg) => total + calculateTokenCount(msg.content),
            0
          ) + calculateTokenCount(completionText),
      },
    };
  } catch (error) {
    logger.error("Error in createChatCompletion:", error);
    throw error;
  }
};

/**
 * Create a streaming chat completion
 */
export const createStreamingChatCompletion = (
  request: LLMCompletionRequestDto,
  userId: string,
  res: Response
): void => {
  try {
    const responseText = generateSimulatedResponse(request.messages);
    const words = responseText.split(" ");

    // Set up SSE stream
    res.write(
      "data: " +
        JSON.stringify({
          id: `chatcmpl-${uuidv4().substring(0, 8)}`,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: request.model,
          choices: [
            {
              index: 0,
              delta: {
                role: "assistant",
              },
              finish_reason: null,
            },
          ],
        }) +
        "\n\n"
    );

    // Stream the response word by word
    let wordIndex = 0;

    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        const word = words[wordIndex];
        res.write(
          "data: " +
            JSON.stringify({
              id: `chatcmpl-${uuidv4().substring(0, 8)}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: request.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: word + " ",
                  },
                  finish_reason: null,
                },
              ],
            }) +
            "\n\n"
        );

        wordIndex++;
      } else {
        // Send the final chunk with finish_reason
        res.write(
          "data: " +
            JSON.stringify({
              id: `chatcmpl-${uuidv4().substring(0, 8)}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: request.model,
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: "stop",
                },
              ],
            }) +
            "\n\n"
        );

        // End the stream
        res.write("data: [DONE]\n\n");
        clearInterval(interval);
        res.end();
      }
    }, 50); // Stream a new word every 50ms

    // Handle client disconnect
    res.on("close", () => {
      clearInterval(interval);
    });
  } catch (error) {
    logger.error("Error creating streaming chat completion:", error);
    res.write(
      "data: " +
        JSON.stringify({
          error: {
            message: "Error creating streaming response",
            type: "server_error",
          },
        }) +
        "\n\n"
    );
    res.end();
  }
};

/**
 * Get the appropriate API key for the user and model
 */
async function getApiKeyForUser(
  userId: string,
  model: string
): Promise<string | null> {
  try {
    // Find all bots for this user
    const userBots = await BotAdapter.findByUserId(userId);

    // Look for a bot with the appropriate configuration
    for (const bot of userBots) {
      if (bot.configuration?.apiKey && bot.configuration?.llmModel === model) {
        return bot.configuration.apiKey;
      }
    }

    // If no exact model match, return the first API key found
    for (const bot of userBots) {
      if (bot.configuration?.apiKey) {
        return bot.configuration.apiKey;
      }
    }

    // In a production app, you might have a fallback system-wide API key
    return null;
  } catch (error) {
    logger.error("Error getting API key:", error);
    return null;
  }
}

/**
 * Calculate token count for a variety of content formats
 */
function calculateTokenCount(
  content: string | any[] | Record<string, any> | undefined | null
): number {
  // If content is undefined or null
  if (content === undefined || content === null) {
    return 0;
  }

  // If content is a string
  if (typeof content === "string") {
    // Rough approximation, assumes ~4 chars per token on average
    return Math.ceil(content.length / 4);
  }

  // If content is an array (multimodal content)
  if (Array.isArray(content)) {
    return content.reduce((acc, part) => {
      // Handle text parts
      if (typeof part === "object" && part !== null) {
        if (part.type === "text" && typeof part.text === "string") {
          return acc + Math.ceil(part.text.length / 4);
        }
        // Handle image parts - estimate based on image size/complexity
        else if (part.type === "image") {
          return acc + 150; // Rough estimate for image description
        }
        // Handle reasoning parts
        else if (
          part.type === "reasoning" &&
          typeof part.reasoning === "string"
        ) {
          return acc + Math.ceil(part.reasoning.length / 4);
        }
        // Handle tool call parts
        else if (part.type === "tool_call" && part.tool_call) {
          const nameTokens =
            typeof part.tool_call.name === "string"
              ? Math.ceil(part.tool_call.name.length / 4)
              : 0;
          const argsTokens =
            typeof part.tool_call.arguments === "string"
              ? Math.ceil(part.tool_call.arguments.length / 4)
              : 0;
          return acc + nameTokens + argsTokens;
        }
      }
      return acc + 10; // Default token count for unknown parts
    }, 0);
  }

  // For tool content or other object structures
  if (typeof content === "object") {
    // Type guard to check for tool result objects
    const isToolResult = (obj: any): obj is { type: string; content: any } =>
      obj &&
      typeof obj === "object" &&
      typeof obj.type === "string" &&
      obj.type === "tool_result" &&
      "content" in obj;

    // Check if it's a tool result with content property
    if (isToolResult(content)) {
      const toolContent = content.content;
      if (typeof toolContent === "string") {
        return Math.ceil(toolContent.length / 4);
      } else if (toolContent && typeof toolContent === "object") {
        // If content is an object, estimate based on JSON string length
        return Math.ceil(JSON.stringify(toolContent).length / 4);
      }
    }

    // Try to estimate based on JSON stringification for any other object
    return Math.ceil(JSON.stringify(content).length / 4);
  }

  return 10; // Default return for unknown types
}

/**
 * Generate a simulated response for demo purposes
 */
function generateSimulatedResponse(
  messages: Array<{ role: string; content: string }>
): string {
  // For demo purposes, just echo back something based on the last message
  const lastMessage = messages[messages.length - 1];

  // Simple response generation
  if (!lastMessage || !lastMessage.content) {
    return "I'm sorry, I don't understand your request.";
  }

  const content = lastMessage.content.toLowerCase();

  if (content.includes("hello") || content.includes("hi ")) {
    return "Hello there! How can I help you today?";
  } else if (content.includes("weather")) {
    return "I don't have real-time weather data, but I can tell you it's always sunny in the world of APIs!";
  } else if (content.includes("help")) {
    return "I'm here to help! You can ask me anything, and I'll do my best to assist you.";
  } else if (content.includes("model")) {
    return "I'm simulating different AI models. In a real implementation, I would use the model you selected to generate responses.";
  } else {
    return "Thank you for your message. This is a simulated response. In a production environment, the actual LLM model would process your request and generate a meaningful response based on your input.";
  }
}

// Call the LLM based on the specified provider
export const callLLM = async (request: {
  botId: string;
  prompt: string;
  systemPrompt?: string;
  history?: Array<{ role: string; content: string }>;
  userId: string;
  username: string;
  model?: string;
  provider?: LLMProvider;
}): Promise<LLMResponse> => {
  try {
    // Get bot configuration from database
    const bot = await BotAdapter.findById(request.botId);
    if (!bot || !bot.configuration) {
      logger.error(`Bot not found or missing configuration: ${request.botId}`);
      return {
        text: "Sorry, I encountered an error with my configuration. Please try again later.",
      };
    }

    // Use provided parameters if available, otherwise use bot configuration
    const llmProvider = request.provider || bot.configuration.llmProvider;
    const llmModel = request.model || bot.configuration.llmModel;

    // Prepare messages array for Vercel AI SDK
    const messages = [];

    // Add system message if available
    if (request.systemPrompt) {
      messages.push({
        role: "system",
        content: request.systemPrompt,
      });
    }

    // Add history if available
    if (request.history && request.history.length > 0) {
      messages.push(...request.history);
    } else {
      // If no history, just add the user's prompt
      messages.push({
        role: "user",
        content: request.prompt,
        name: request.username || undefined,
      });
    }

    // Use Vercel AI SDK via createChatCompletion
    const completionRequest: LLMCompletionRequestDto = {
      model: llmModel,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // Call the Vercel AI SDK integration
    try {
      const completion = await createChatCompletion(
        completionRequest,
        request.userId
      );

      // Extract the assistant's message
      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage || !assistantMessage.content) {
        throw new Error("No valid response received from LLM");
      }

      // Check if the response indicates image generation is needed
      // This is a simple heuristic - in a production system, you would
      // use proper function/tool calling
      const shouldGenerateImage =
        assistantMessage.content.includes("![") || // Markdown image syntax
        assistantMessage.content.toLowerCase().includes("generate an image") ||
        assistantMessage.content.toLowerCase().includes("create an image");

      let imagePrompt = null;
      if (shouldGenerateImage) {
        // Simple extraction of image description
        const pattern =
          /!\[.*?\]\((.+?)\)|generate an image of (.+?)(?:\.|$)|create an image of (.+?)(?:\.|$)/i;
        const match = assistantMessage.content.match(pattern);
        if (match) {
          imagePrompt = match[1] || match[2] || match[3];
        } else {
          // Fall back to using the user's prompt for image generation
          imagePrompt = request.prompt;
        }
      }

      return {
        text: assistantMessage.content,
        generateImage: shouldGenerateImage,
        imagePrompt: imagePrompt || undefined,
      };
    } catch (error) {
      logger.error(`Error generating completion with Vercel AI SDK: ${error}`);

      // Fall back to legacy direct API calls if Vercel AI SDK fails
      logger.info(
        `Falling back to direct API call for provider ${llmProvider}`
      );

      // Legacy direct API integration
      const { apiKey } = bot.configuration;
      switch (llmProvider) {
        case "openai":
          return await callOpenAI(request.prompt, llmModel, apiKey);
        case "anthropic":
          return await callAnthropic(request.prompt, llmModel, apiKey);
        case "google":
          return await callGoogle(request.prompt, llmModel, apiKey);
        case "custom":
          return await callCustomLLM(request.prompt, llmModel, apiKey);
        default:
          // Default to OpenAI if provider is not recognized
          return await callOpenAI(request.prompt, "gpt-3.5-turbo", apiKey);
      }
    }
  } catch (error) {
    logger.error(`Error calling LLM for bot ${request.botId}:`, error);
    return {
      text: "Sorry, I encountered an error connecting to my AI service. Please try again later.",
    };
  }
};

// Call OpenAI API
const callOpenAI = async (
  prompt: string,
  model: string,
  apiKey: string
): Promise<LLMResponse> => {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: model || "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      tool_choice: "auto",
      tools: [
        {
          type: "function",
          function: {
            name: "generate_image",
            description: "Generate an image based on a description",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The description of the image to generate",
                },
              },
              required: ["prompt"],
            },
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const responseMessage = response.data.choices[0].message;

  // Check for tool calls
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    return {
      text:
        responseMessage.content ||
        "I need to generate an image based on your request.",
      toolCalls: responseMessage.tool_calls.map((tool: any) => ({
        name: tool.function.name,
        arguments: JSON.parse(tool.function.arguments),
      })),
    };
  }

  return {
    text: responseMessage.content,
  };
};

// Call Anthropic API
const callAnthropic = async (
  prompt: string,
  model: string,
  apiKey: string
): Promise<LLMResponse> => {
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: model || "claude-3-sonnet-20240229",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    text: response.data.content[0].text,
  };
};

// Call Google API (Gemini)
const callGoogle = async (
  prompt: string,
  model: string,
  apiKey: string
): Promise<LLMResponse> => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/${model || "gemini-pro"}:generateContent`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generation_config: {
        temperature: 0.7,
        max_output_tokens: 1000,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        key: apiKey,
      },
    }
  );

  return {
    text: response.data.candidates[0].content.parts[0].text,
  };
};

// Call custom LLM API
const callCustomLLM = async (
  prompt: string,
  endpoint: string,
  apiKey: string
): Promise<LLMResponse> => {
  const response = await axios.post(
    endpoint,
    {
      prompt,
      apiKey,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  return {
    text: response.data.response || response.data.text,
  };
};

async function callOpenAIDirectly(
  request: LLMCompletionRequestDto,
  apiKey: string
): Promise<LLMCompletionResponseDto> {
  // Implement direct OpenAI API call
  throw new Error("Direct OpenAI API call not implemented");
}

async function callAnthropicDirectly(
  request: LLMCompletionRequestDto,
  apiKey: string
): Promise<LLMCompletionResponseDto> {
  // Implement direct Anthropic API call
  throw new Error("Direct Anthropic API call not implemented");
}

async function callGoogleDirectly(
  request: LLMCompletionRequestDto,
  apiKey: string
): Promise<LLMCompletionResponseDto> {
  // Implement direct Google API call
  throw new Error("Direct Google API call not implemented");
}

async function callGenericProviderDirectly(
  request: LLMCompletionRequestDto,
  apiKey: string
): Promise<LLMCompletionResponseDto> {
  // Implement generic provider API call
  throw new Error("Direct generic provider API call not implemented");
}

/**
 * Enable or disable a specific provider
 */
export const updateProviderStatus = async (
  provider: LLMProvider,
  enabled: boolean
): Promise<void> => {
  try {
    const config = await loadProviderConfig();

    if (!config.providers[provider]) {
      config.providers[provider] = { enabled };
    } else {
      config.providers[provider].enabled = enabled;
    }

    await saveProviderConfig(config);

    // Refresh the provider registry
    await refreshAiProviderRegistry();

    logger.info(`Provider ${provider} ${enabled ? "enabled" : "disabled"}`);
  } catch (error) {
    logger.error(`Error updating provider status for ${provider}:`, error);
    throw error;
  }
};

/**
 * Add or update a custom provider
 */
export const configureCustomProvider = async (
  customProvider: ApiCustomProviderConfig
): Promise<void> => {
  try {
    const config = await loadProviderConfig();

    if (!config.providers[LLMProvider.CUSTOM]) {
      config.providers[LLMProvider.CUSTOM] = {
        enabled: true,
        custom_providers: [customProvider],
      };
    } else {
      // Enable the custom provider category
      config.providers[LLMProvider.CUSTOM].enabled = true;

      // Initialize custom_providers array if it doesn't exist
      if (!config.providers[LLMProvider.CUSTOM].custom_providers) {
        config.providers[LLMProvider.CUSTOM].custom_providers = [];
      }

      // Find existing provider with the same name and update or add
      const existingIndex = config.providers[
        LLMProvider.CUSTOM
      ].custom_providers!.findIndex((p) => p.name === customProvider.name);

      if (existingIndex >= 0) {
        config.providers[LLMProvider.CUSTOM].custom_providers![existingIndex] =
          customProvider;
      } else {
        config.providers[LLMProvider.CUSTOM].custom_providers!.push(
          customProvider
        );
      }
    }

    await saveProviderConfig(config);

    // Refresh the provider registry
    await refreshAiProviderRegistry();

    logger.info(
      `Custom provider ${customProvider.name} configured successfully`
    );
  } catch (error) {
    logger.error(
      `Error configuring custom provider ${customProvider.name}:`,
      error
    );
    throw error;
  }
};

/**
 * Remove a custom provider
 */
export const removeCustomProvider = async (
  providerName: string
): Promise<boolean> => {
  try {
    const config = await loadProviderConfig();

    if (!config.providers[LLMProvider.CUSTOM]?.custom_providers) {
      return false;
    }

    const initialLength =
      config.providers[LLMProvider.CUSTOM].custom_providers!.length;

    config.providers[LLMProvider.CUSTOM].custom_providers = config.providers[
      LLMProvider.CUSTOM
    ].custom_providers!.filter((p) => p.name !== providerName);

    const removed =
      config.providers[LLMProvider.CUSTOM].custom_providers!.length <
      initialLength;

    if (removed) {
      await saveProviderConfig(config);

      // Refresh the provider registry
      await refreshAiProviderRegistry();

      logger.info(`Custom provider ${providerName} removed successfully`);
    }

    return removed;
  } catch (error) {
    logger.error(`Error removing custom provider ${providerName}:`, error);
    throw error;
  }
};

/**
 * Get the OpenRouter model variant slug for a given model ID
 * This maps standard model IDs to OpenRouter's model_variant_slug format
 */
async function getModelVariantSlug(modelId: string): Promise<string | null> {
  try {
    // For OpenRouter's special routing endpoints, use them directly
    if (
      modelId === "openrouter/auto" ||
      modelId === "openrouter/best" ||
      modelId === "openrouter/fastest" ||
      modelId === "openrouter/cheapest"
    ) {
      return modelId.split("/")[1];
    }

    // For regular model IDs like 'anthropic/claude-3-5-sonnet'
    if (modelId.includes("/")) {
      // Get model mappings from OpenRouter API
      const openRouterModels = await fetchOpenRouterModels();

      // Look for an exact match
      const exactMatch = openRouterModels.find(
        (model) =>
          model.id === modelId || `${model.owned_by}/${model.id}` === modelId
      );

      if (exactMatch && exactMatch.model_variant_slug) {
        logger.info(
          `Found exact model variant slug match: ${exactMatch.model_variant_slug}`
        );
        return exactMatch.model_variant_slug;
      }

      // Try fuzzy matching
      const [provider, name] = modelId.split("/");
      const fuzzyMatch = openRouterModels.find(
        (model) =>
          model.owned_by.toLowerCase() === provider.toLowerCase() &&
          model.id.includes(name)
      );

      if (fuzzyMatch && fuzzyMatch.model_variant_slug) {
        logger.info(
          `Found fuzzy model variant slug match: ${fuzzyMatch.model_variant_slug}`
        );
        return fuzzyMatch.model_variant_slug;
      }
    }

    // For OpenAI/Anthropic/Google models without a provider prefix
    // These don't use model_variant_slug in OpenRouter
    return null;
  } catch (error) {
    logger.error("Error getting model variant slug:", error);
    return null;
  }
}
