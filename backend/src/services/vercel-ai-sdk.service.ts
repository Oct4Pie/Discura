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
import { deepgram, createDeepgram } from "@ai-sdk/deepgram";
import { deepinfra, createDeepInfra } from "@ai-sdk/deepinfra";
import { deepseek, createDeepSeek } from "@ai-sdk/deepseek";
import { elevenlabs, createElevenLabs } from "@ai-sdk/elevenlabs";
import { fireworks, createFireworks } from "@ai-sdk/fireworks";
import { gladia, createGladia } from "@ai-sdk/gladia";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { vertex, createVertex } from "@ai-sdk/google-vertex";
import { groq, createGroq } from "@ai-sdk/groq";
import { hume, createHume } from "@ai-sdk/hume";
import { lmnt, createLMNT } from "@ai-sdk/lmnt";
import { mistral, createMistral } from "@ai-sdk/mistral";
import { openai, createOpenAI } from "@ai-sdk/openai";
import {
  createOpenAICompatible,
  OpenAICompatibleProviderSettings,
} from "@ai-sdk/openai-compatible";
import { perplexity, createPerplexity } from "@ai-sdk/perplexity";
import { revai, createRevai } from "@ai-sdk/revai";
import { togetherai, createTogetherAI } from "@ai-sdk/togetherai";
import { xai, createXai } from "@ai-sdk/xai";
import {
  LLMProvider,
  LLMModelData,
  CustomProviderConfig as ApiCustomProviderConfig,
  ProviderRegistryConfiguration,
  ProviderConfiguration,
  CustomProviderConfig,
  LLMCompletionResponseDto,
  LLMCompletionRequestDto,
} from "@discura/common";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { CoreMessage, createProviderRegistry, generateText } from "ai";
import axios from "axios";

import { logger } from "../utils/logger";
import { getModelVariantSlug } from "./openrouter.service";

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
          `${providerName} provider is enabled but no API key found in ${providerEnum.toUpperCase()}_KEY environment variable`
        );
        // Don't auto-disable the provider - we can still use it to list models from OpenRouter
        // We just won't be able to make completions with it
      }
    }
  }

  // Special handling for OpenRouter
  if (config.providers[LLMProvider.OPENROUTER]?.enabled) {
    const apiKey = getApiKey(LLMProvider.OPENROUTER);
    
    try {
      // If API key is available, register the full provider with completion capabilities
      if (apiKey) {
        registry.openrouter = createOpenRouter({
          apiKey,
          // Add optional configuration
          headers: {
            "HTTP-Referer":
              process.env.OPENROUTER_REFERER || "https://discura.ai",
            "X-Title": "Discura Bot Platform",
          },
        });
        logger.info("Added OpenRouter provider to registry with API key");
      } else {
        // Don't register OpenRouter in the registry without an API key
        // We'll still be able to fetch models from the public API for display
        logger.info("OpenRouter provider enabled without API key - will support model listing only");
      }

      // Update the custom provider config to avoid duplicate registration
      delete CUSTOM_PROVIDER_CONFIGS.openrouter;
    } catch (error) {
      logger.error("Failed to create OpenRouter provider:", error);
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
            `${providerName} provider is enabled but no API key found in ${providerEnum.toUpperCase()}_KEY`
          );
          // Don't auto-disable the provider - we can still use it to list models from OpenRouter
          continue;
        }
      }

      // Create the provider with its configuration
      try {
        const baseOptions: OpenAICompatibleProviderSettings = {
          name: providerName,
          baseURL: providerConfig.baseURL || "",
        };

        // Add API key if required
        if (providerConfig.requiresApiKey) {
          baseOptions.apiKey = getApiKey(providerEnum) || "";
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

/**
 * Calculate token count for a variety of content formats
 * Used by the Vercel AI SDK integration
 */
function calculateTokenCount(
  content: string | any[] | Record<string, any> | undefined | null,
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
      }
      return acc + 10; // Default token count for unknown parts
    }, 0);
  }

  // For object structures
  if (typeof content === "object") {
    // Try to estimate based on JSON stringification
    return Math.ceil(JSON.stringify(content).length / 4);
  }

  return 10; // Default return for unknown types
}

/**
 * Create a chat completion using Vercel AI SDK
 * This offers more flexibility and better integration with various providers
 */
export const createChatCompletionWithVercelAi = async (
  request: LLMCompletionRequestDto,
  userId: string,
): Promise<LLMCompletionResponseDto> => {
  try {
    logger.info(
      `Creating chat completion with Vercel AI SDK using model: ${request.model}`,
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
            `No variant slug found, using model ID directly with OpenRouter: ${request.model}`,
          );
        }
      } catch (error) {
        // If there's an error getting the variant slug, use the default mapping
        logger.warn(
          `Error getting OpenRouter variant slug: ${error}. Using default mapping.`,
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

    // Check if the provider exists in the registry
    if (providerName === "openrouter" && registry.openrouter) {
      // For OpenRouter, use different selection methods based on special routing endpoints
      if (["auto", "best", "fastest", "cheapest"].includes(modelId)) {
        // These are special OpenRouter routing endpoints, use them directly
        logger.info(`Using OpenRouter routing endpoint: ${modelId}`);
        // Use chat() for all models since OpenRouter supports it widely
        try {
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
            0,
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
        } catch (error) {
          logger.error(`Error using OpenRouter with endpoint ${modelId}:`, error);
          throw new Error(`Provider ${providerName} error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    // For standard models that use the provider registry
    try {
      // Check if the provider exists in the registry before using it
      if (!registry[providerName]) {
        logger.error(`Provider ${providerName} not found in registry or not configured properly`);
        throw new Error(`Provider ${providerName} not configured. Check if the API key is set in the environment variables (${providerName.toUpperCase()}_KEY)`);
      }

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
        0,
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
        `Completion generated with Vercel AI SDK in ${endTime - startTime}ms`,
      );

      return response;
    } catch (error) {
      logger.error(`Error using provider ${providerName} with model ${modelId}:`, error);
      throw new Error(`Provider ${providerName} error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  } catch (error) {
    logger.error("Error in createChatCompletionWithVercelAi:", error);

    // Re-throw as a structured error for the API
    throw new Error(
      `Failed to generate completion: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
