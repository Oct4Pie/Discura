/**
 * Vercel AI SDK Integration Service
 *
 * This service provides a unified interface for different LLM providers using Vercel AI SDK.
 * It handles provider registry construction, model mapping, and integration with our custom types.
 */
import fs from "fs/promises";
import path from "path";

import { bedrock, createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { assemblyai, createAssemblyAI } from "@ai-sdk/assemblyai";
import { createAzure } from "@ai-sdk/azure";
import { cerebras, createCerebras } from "@ai-sdk/cerebras";
import { cohere, createCohere } from "@ai-sdk/cohere";
import { deepinfra, createDeepInfra } from "@ai-sdk/deepinfra";
import { deepseek, createDeepSeek } from "@ai-sdk/deepseek";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { vertex, createVertex } from "@ai-sdk/google-vertex";
import { mistral, createMistral } from "@ai-sdk/mistral";
import { groq, createGroq } from "@ai-sdk/groq";
import { fireworks, createFireworks } from "@ai-sdk/fireworks";
import { createOpenAICompatible, OpenAICompatibleProviderSettings } from "@ai-sdk/openai-compatible";
import { perplexity, createPerplexity } from "@ai-sdk/perplexity";
import { revai, createRevai } from "@ai-sdk/revai";
import { togetherai, createTogetherAI } from "@ai-sdk/togetherai";
import { xai, createXai } from "@ai-sdk/xai";
import { elevenlabs, createElevenLabs } from "@ai-sdk/elevenlabs";
import { gladia, createGladia } from "@ai-sdk/gladia";
import { deepgram, createDeepgram } from "@ai-sdk/deepgram";
import { lmnt, createLMNT } from "@ai-sdk/lmnt";
import { hume, createHume } from "@ai-sdk/hume";
import {
  LLMProvider,
  LLMModelData,
  CustomProviderConfig as ApiCustomProviderConfig,
} from "@discura/common";
import { 
  ProviderRegistryConfiguration, 
  ProviderConfiguration,
  CustomProviderConfig 
} from "@discura/common";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createProviderRegistry } from "ai";
import axios from "axios";

import { logger } from "../utils/logger";

// Provider config path - updated to point to root directory
const PROVIDER_CONFIG_PATH = path.join(
  process.cwd(),
  "..",
  "provider-config.json",
);

// Model ID separator for registry
const MODEL_ID_SEPARATOR = " > ";

// Configuration for custom OpenAI-compatible providers that aren't directly available in the AI SDK
interface ProviderConfig {
  useOpenAICompatible: boolean;
  baseURL?: string;
  requiresApiKey: boolean;
  options?: Record<string, any>;
}

// Configuration for providers that need custom setup via createOpenAICompatible
const CUSTOM_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openrouter: {
    useOpenAICompatible: true,
    baseURL: "https://openrouter.ai/api/v1",
    requiresApiKey: true,
    options: {
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://discura.ai",
        "X-Title": "Discura Bot Platform",
      },
    },
  },
  qwen: {
    useOpenAICompatible: true,
    baseURL: "https://api.qwen.ai/v1",
    requiresApiKey: true,
  },
  chutes: {
    useOpenAICompatible: true,
    baseURL: "https://api.chutes.ai/v1",
    requiresApiKey: true,
  },
  microsoft: {
    useOpenAICompatible: true,
    baseURL: "https://api.cognitive.microsoft.com/openai/deployments",
    requiresApiKey: true,
  },
  fireworks: {
    useOpenAICompatible: true,
    baseURL: "https://api.fireworks.ai/inference/v1",
    requiresApiKey: true,
  },
  together: {
    useOpenAICompatible: true,
    baseURL: "https://api.together.xyz/v1",
    requiresApiKey: true,
  },
  anyscale: {
    useOpenAICompatible: true,
    baseURL: "https://api.anyscale.com/v1",
    requiresApiKey: true,
  },
  perplexity: {
    useOpenAICompatible: true,
    baseURL: "https://api.perplexity.ai",
    requiresApiKey: true,
  },
  deepinfra: {
    useOpenAICompatible: true,
    baseURL: "https://api.deepinfra.com/v1/openai",
    requiresApiKey: true,
  },
  voyage: {
    useOpenAICompatible: true,
    baseURL: "https://api.voyageai.com/v1",
    requiresApiKey: true,
  },
  ollama: {
    useOpenAICompatible: true,
    baseURL: process.env.OLLAMA_HOST || "http://localhost:11434",
    requiresApiKey: false,
  },
  lmstudio: {
    useOpenAICompatible: true,
    baseURL: process.env.LMSTUDIO_HOST || "http://localhost:1234/v1",
    requiresApiKey: false,
  },
};

/**
 * Load the provider configuration from file
 */
export async function loadProviderConfig(): Promise<ProviderRegistryConfiguration> {
  try {
    // Check if config file exists, otherwise create default
    try {
      const configData = await fs.readFile(PROVIDER_CONFIG_PATH, "utf-8");
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
          {} as Record<LLMProvider, ProviderConfiguration>,
        ),
      };

      // Ensure the directory exists
      await fs.mkdir(path.dirname(PROVIDER_CONFIG_PATH), { recursive: true });

      // Write default config
      await fs.writeFile(
        PROVIDER_CONFIG_PATH,
        JSON.stringify(defaultConfig, null, 2),
        "utf-8",
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
        {} as Record<LLMProvider, ProviderConfiguration>,
      ),
    };
  }
}

/**
 * Save the provider configuration to file
 */
export async function saveProviderConfig(
  config: ProviderRegistryConfiguration,
): Promise<void> {
  try {
    await fs.writeFile(
      PROVIDER_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      "utf-8",
    );
    logger.info("Provider configuration saved successfully");
  } catch (error) {
    logger.error("Error saving provider configuration:", error);
    throw error;
  }
}

/**
 * Get API key from environment variables for a provider
 */
export function getApiKey(provider: LLMProvider): string | undefined {
  const envVarName = `${provider.toUpperCase()}_KEY`;
  return process.env[envVarName];
}

/**
 * Create a Vercel AI SDK provider registry based on our configuration
 */
export async function createAiProviderRegistry() {
  const config = await loadProviderConfig();
  const registry: Record<string, any> = {};

  // Map of AI SDK built-in providers with their create functions
  const builtInProviders: Record<string, any> = {
    openai: createOpenAI,
    anthropic: createAnthropic,
    google: createGoogleGenerativeAI,
    vertex: createVertex,
    mistral: createMistral,
    cohere: createCohere,
    groq: createGroq,
    deepseek: createDeepSeek,
    amazon: createAmazonBedrock,
    azure: createOpenAI,
    fireworks: createFireworks,
    togetherai: createTogetherAI,
    perplexity: createPerplexity,
    deepinfra: createDeepInfra,
    xai: createXai,
    cerebras: createCerebras,
    elevenlabs: createElevenLabs,
    gladia: createGladia,
    assemblyai: createAssemblyAI,
    revai: createRevai,
    deepgram: createDeepgram,
    lmnt: createLMNT,
    hume: createHume,
  };

  // Add all built-in providers that are enabled and have API keys
  for (const [providerName, providerCreator] of Object.entries(
    builtInProviders,
  )) {
    // Get corresponding LLMProvider enum value
    const enumKey = providerName.toUpperCase() as keyof typeof LLMProvider;
    const providerEnum = LLMProvider[enumKey] as LLMProvider;

    // If this provider is enabled in our config
    if (providerEnum && config.providers[providerEnum]?.enabled) {
      // Check for API key
      const apiKey = getApiKey(providerEnum);
      if (apiKey) {
        try {
          // Create provider instance with appropriate API key
          registry[providerName] = providerCreator({ apiKey });
          logger.info(`Added ${providerName} provider to registry`);
        } catch (error) {
          logger.error(`Failed to create ${providerName} provider:`, error);
        }
      } else {
        logger.warn(
          `${providerName} provider is enabled but no API key found in ${providerEnum.toUpperCase()}_KEY`,
        );
        // Auto-disable the provider since it can't function without an API key
        config.providers[providerEnum].enabled = false;
      }
    }
  }

  // Add native OpenRouter provider if enabled and API key exists
  if (config.providers[LLMProvider.OPENROUTER]?.enabled) {
    const apiKey = getApiKey(LLMProvider.OPENROUTER);
    if (apiKey) {
      try {
        registry.openrouter = createOpenRouter({
          apiKey,
          // Add optional configuration
          headers: {
            "HTTP-Referer":
              process.env.OPENROUTER_REFERER || "https://discura.ai",
            "X-Title": "Discura Bot Platform",
          },
        });
        logger.info("Added native OpenRouter provider to registry");

        // Update the custom provider config to avoid duplicate registration
        delete CUSTOM_PROVIDER_CONFIGS.openrouter;
      } catch (error) {
        logger.error("Failed to create native OpenRouter provider:", error);
      }
    } else {
      logger.warn(
        `OpenRouter provider is enabled but no API key found in OPENROUTER_KEY`,
      );
      // Auto-disable the provider since it can't function without an API key
      config.providers[LLMProvider.OPENROUTER].enabled = false;
    }
  }

  // Add custom OpenAI-compatible providers that are enabled in our configuration
  for (const [providerName, providerConfig] of Object.entries(
    CUSTOM_PROVIDER_CONFIGS,
  )) {
    // Skip if provider is already added as a built-in provider
    if (providerName in builtInProviders) {
      continue;
    }

    // Get corresponding LLMProvider enum value if it exists
    const enumKey = providerName.toUpperCase() as keyof typeof LLMProvider;
    const providerEnum = LLMProvider[enumKey] as LLMProvider | undefined;

    // If this provider is in our LLMProvider enum and is enabled
    if (providerEnum && config.providers[providerEnum]?.enabled) {
      // Check if API key is required and available
      if (providerConfig.requiresApiKey) {
        const apiKey = getApiKey(providerEnum);
        if (!apiKey) {
          logger.warn(
            `${providerName} provider is enabled but no API key found in ${providerEnum.toUpperCase()}_KEY`,
          );
          // Auto-disable the provider since it can't function without an API key
          config.providers[providerEnum].enabled = false;
          continue;
        }
      }

      // Create the provider with its configuration
      try {
        const baseOptions: OpenAICompatibleProviderSettings = {
          name: providerName,
          baseURL: providerConfig.baseURL || '',
        };

        // Add API key if required
        if (providerConfig.requiresApiKey) {
          baseOptions.apiKey = getApiKey(providerEnum) || '';
        }

        // Add any additional options
        if (providerConfig.options) {
          Object.assign(baseOptions, providerConfig.options);
        }

        // Create the provider
        registry[providerName] = createOpenAICompatible(baseOptions);
        logger.info(`Added ${providerName} provider to registry`);
      } catch (error) {
        logger.error(`Failed to create ${providerName} provider:`, error);
      }
    }
  }

  // Save updated config with auto-disabled providers
  await saveProviderConfig(config);

  // Create and return the provider registry
  return createProviderRegistry(registry, { separator: MODEL_ID_SEPARATOR });
}

/**
 * Convert from our LLMModelData to Vercel AI model ID format
 */
export function convertToVercelAiModelId(model: LLMModelData): string {
  // Map from our provider to Vercel AI provider prefix
  const providerMapping: Record<string, string> = {
    // Built-in providers (native AI SDK)
    openai: "openai",
    anthropic: "anthropic",
    google: "google",
    mistral: "mistral",
    cohere: "cohere",
    groq: "groq",
    deepseek: "deepseek",
    amazon: "amazon",
    bedrock: "amazon", // Alias for amazon bedrock
    azure: "azure",
    fireworks: "fireworks",
    togetherai: "togetherai",
    together: "togetherai", // Alias
    perplexity: "perplexity",
    deepinfra: "deepinfra",
    xai: "xai",
    grok: "xai", // Alias
    ollama: "ollama",
    huggingface: "huggingface",
    cerebras: "cerebras",
    elevenlabs: "elevenlabs",
    gladia: "gladia",
    assemblyai: "assemblyai",
    revai: "revai",
    deepgram: "deepgram",
    lmnt: "lmnt",
    hume: "hume",

    // OpenAI-compatible providers
    chutes: "chutes",
    microsoft: "microsoft",
    qwen: "qwen",
    openrouter: "openrouter",
    anyscale: "anyscale",
    voyage: "voyage",
    voyageai: "voyage",
    lmstudio: "lmstudio",
  };

  const provider =
    providerMapping[model.owned_by.toLowerCase()] ||
    model.owned_by.toLowerCase();

  // Use provider_model_id if available, otherwise fall back to id
  const modelId = model.provider_model_id || model.id;

  return `${provider}${MODEL_ID_SEPARATOR}${modelId}`;
}

/**
 * Parse a Vercel AI model ID back to our format
 */
export function parseVercelAiModelId(vercelAiModelId: string): {
  provider: string;
  modelId: string;
} {
  const [provider, ...modelParts] = vercelAiModelId.split(MODEL_ID_SEPARATOR);
  return {
    provider,
    modelId: modelParts.join(MODEL_ID_SEPARATOR), // Rejoin in case model ID itself contains the separator
  };
}

// Initialize the provider registry on module load
let aiProviderRegistry: any = null;
export async function getAiProviderRegistry() {
  if (!aiProviderRegistry) {
    aiProviderRegistry = await createAiProviderRegistry();
  }
  return aiProviderRegistry;
}

// Re-initialize the provider registry (useful after config changes)
export async function refreshAiProviderRegistry() {
  aiProviderRegistry = await createAiProviderRegistry();
  return aiProviderRegistry;
}
