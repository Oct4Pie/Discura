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

// Import centralized provider constants from the common package
import {
  PROVIDER_CACHE_TTL,
  DEFAULT_PROVIDER_MODELS,
  DEFAULT_MODELS,
  OPENROUTER_ROUTING_MODELS,
  LLM_PROVIDER,
} from "@discura/common/constants";

// Import specific types from Vercel AI SDK
import axios from "axios";
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
} from "./vercel-ai-sdk.service";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { logger } from "../utils/logger";
import {
  CoreMessage,
  LanguageModelV1,
  GenerateTextResult,
  generateText,
} from "ai"; // Changed from '@ai-sdk/core'

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

// Use labels from common package as display names
const PROVIDER_DISPLAY_NAMES: Record<LLMProvider, string> = Object.entries(
  LLM_PROVIDER.LABELS
).reduce(
  (acc, [key, value]) => {
    acc[key as LLMProvider] = value;
    return acc;
  },
  {} as Record<LLMProvider, string>
);

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
 * Calculate token count for a variety of content formats
 * Used by the Vercel AI SDK integration
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
 * Create a chat completion using Vercel AI SDK
 * This offers more flexibility and better integration with various providers
 */
export const createChatCompletionWithVercelAi = async (
  request: LLMCompletionRequestDto,
  userId: string
): Promise<LLMCompletionResponseDto> => {
  try {
    const { model: modelId, provider } = request;
    const effectiveProvider = provider || LLMProvider.OPENROUTER; // Default to OpenRouter if not specified

    logger.info(
      `Creating chat completion with Vercel AI SDK. Model: ${modelId}, Provider: ${effectiveProvider}`
    );

    const registry = await getAiProviderRegistry();

    const messages: CoreMessage[] = request.messages.map((msg) => ({
      role:
        msg.role === "user"
          ? "user"
          : msg.role === "assistant"
            ? "assistant"
            : msg.role === "system"
              ? "system"
              : "user", // Default to user if role is unexpected
      content: msg.content,
      name: msg.name,
    }));

    const startTime = Date.now();
    let result: GenerateTextResult<any, any>;

    // Create a standard response identifier format
    const responseModelIdentifier = `${effectiveProvider}/${modelId}`;

    // Check if the provider exists in the registry
    if (!registry[effectiveProvider]) {
      logger.error(
        `Provider ${effectiveProvider} not found in registry. Ensure API key is set with ${effectiveProvider.toUpperCase()}_KEY`
      );
      throw new Error(
        `Provider ${effectiveProvider} not configured in the Vercel AI SDK registry.`
      );
    }

    // Use the provider's chat method directly with the model ID
    // This works consistently for all providers including OpenRouter
    const model = registry[effectiveProvider].chat(modelId);

    result = await generateText({
      model,
      messages,
      temperature: request.temperature,
      topP: request.top_p,
      maxTokens: request.max_tokens,
      presencePenalty: request.presence_penalty,
      frequencyPenalty: request.frequency_penalty,
    });

    const endTime = Date.now();
    const promptTokens = messages.reduce(
      (acc, msg) => acc + calculateTokenCount(msg.content),
      0
    );
    const completionTokens = calculateTokenCount(result.text);

    logger.info(
      `Completion generated with Vercel AI SDK in ${endTime - startTime}ms. Provider: ${effectiveProvider}, Model: ${modelId}`
    );

    return {
      id: `${effectiveProvider}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: responseModelIdentifier,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: result.text,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };
  } catch (error) {
    logger.error("Error in createChatCompletionWithVercelAi:", error);
    throw new Error(
      `Failed to generate completion: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Create a chat completion using the selected model
 * This is the main entry point for generating completions
 */
export const createChatCompletion = async (
  request: LLMCompletionRequestDto,
  userId: string
): Promise<LLMCompletionResponseDto> => {
  try {
    // Use Vercel AI SDK for all completions
    return await createChatCompletionWithVercelAi(request, userId);
  } catch (error) {
    logger.error("Error in createChatCompletion:", error);

    // If we get here, the Vercel AI SDK failed completely
    // Re-throw the error rather than using a simulated response
    throw new Error(
      `Failed to generate completion: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Call the LLM based on the specified provider
 * This function is used by bot services to generate responses
 */
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
      return {
        text: "Sorry, I encountered an error connecting to my AI service. Please try again later.",
      };
    }
  } catch (error) {
    logger.error(`Error calling LLM for bot ${request.botId}:`, error);
    return {
      text: "Sorry, I encountered an error connecting to my AI service. Please try again later.",
    };
  }
};

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

    const validModels = filterValidModels(openRouterModelsResponse);

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
          // Add special routing endpoints from the centralized constant
          const routingEndpoints = OPENROUTER_ROUTING_MODELS;

          // Filter the models to just get valid ones for display
          const validModels = filterValidModels(openRouterModels);

          // Convert from OpenRouter format to our LLMModelData format
          const enhancedModels = validModels.map(
            convertOpenRouterModelToEnhancedModel
          );

          // Combine routing endpoints with regular models
          models = [...routingEndpoints, ...enhancedModels];

          logger.info(
            `Fetched ${models.length} models from OpenRouter API (${enhancedModels.length} regular models plus ${routingEndpoints.length} routing endpoints)`
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
 * Fetch models and populate the cache
 * This function is called periodically to refresh the cache
 */
async function fetchModelsAndPopulateCache(
  forceRefresh = false
): Promise<void> {
  if (!modelCache) {
    logger.warn(
      "fetchModelsAndPopulateCache called with no modelCache initialized. Attempting to load."
    );
    await loadModelCache(); // Ensure cache is loaded
    if (!modelCache) {
      logger.error(
        "Failed to load or initialize modelCache in fetchModelsAndPopulateCache. Aborting fetch."
      );
      // Initialize to a minimal valid state to prevent further errors down the line
      modelCache = {
        timestamp: Date.now(),
        openRouterLastFetch: 0,
        providers: {} as Record<LLMProvider, ProviderModelsResponseDto>,
      };
      await saveModelCache(); // Save the initialized empty cache
      return;
    }
  }

  // Fetch from OpenRouter if not rate-limited and its cache is stale or refresh is forced.
  // OpenRouter is always considered for model discovery.
  if (
    !shouldThrottleOpenRouter() &&
    (forceRefresh ||
      !modelCache.openRouterLastFetch || // First fetch attempt
      Date.now() - modelCache.openRouterLastFetch > OPENROUTER_CACHE_TTL) // Cache expired
  ) {
    try {
      const openRouterModels = await fetchModelsFromOpenRouter();
      Object.entries(openRouterModels).forEach(([provider, models]) => {
        const providerEnum = provider as LLMProvider;
        if (modelCache!.providers[providerEnum]) {
          modelCache!.providers[providerEnum].models = models;
          modelCache!.providers[providerEnum].last_updated = Date.now();
        }
      });
      modelCache!.openRouterLastFetch = Date.now();
      await saveModelCache();
      logger.info("Fetched and cached models from OpenRouter");
    } catch (error) {
      logger.error("Error fetching models from OpenRouter:", error);
    }
  }

  // Fetch models for each provider if their cache is stale or refresh is forced
  const config = await loadProviderConfig();
  const enabledProviders = Object.entries(config.providers)
    .filter(([_, config]) => config.enabled)
    .map(([provider]) => provider as LLMProvider);

  for (const provider of enabledProviders) {
    if (
      forceRefresh ||
      !modelCache.providers[provider] ||
      isCacheExpired(provider)
    ) {
      try {
        const providerModels = await fetchProviderModels(provider);
        modelCache.providers[provider] = providerModels;
        await saveModelCache();
        logger.info(`Fetched and cached models for provider ${provider}`);
      } catch (error) {
        logger.error(`Error fetching models for provider ${provider}:`, error);
      }
    }
  }
}
