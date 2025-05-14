/**
 * OpenRouter Integration Service
 *
 * This service provides integration with OpenRouter API for fetching
 * models and routing requests to different AI providers.
 */
import fs from "fs/promises";
import path from "path";

import { LLMProvider } from "@discura/common";
import axios from "axios";

import { logger } from "../utils/logger";

// Cache file for OpenRouter models
const OPENROUTER_MODELS_CACHE_FILE = path.join(
  process.cwd(),
  "data",
  "provider-models-cache.json",
);

// Cache TTL in milliseconds (default: 12 hours)
const OPENROUTER_CACHE_TTL = parseInt(
  process.env.OPENROUTER_CACHE_TTL || "43200000",
  10,
);

// OpenRouter rate limit protection
const MIN_REQUEST_INTERVAL = 5000; // milliseconds between requests
let lastRequestTimestamp = 0;

// Cache for OpenRouter models
let modelsCache: {
  timestamp: number;
  models: any[] | { data: any[] } | Record<string, any>;
} | null = null;

/**
 * Initialize the cache on module load
 */
async function initializeCache() {
  try {
    const data = await fs.readFile(OPENROUTER_MODELS_CACHE_FILE, "utf-8");
    modelsCache = JSON.parse(data);
    logger.info("Loaded OpenRouter models cache from file");
  } catch (error) {
    logger.info("No OpenRouter models cache found, will create on first fetch");
    modelsCache = null;
  }
}

// Initialize cache when module is loaded
initializeCache().catch((error) => {
  logger.error("Failed to initialize OpenRouter models cache:", error);
});

/**
 * Save the cache to disk
 */
async function saveCache() {
  if (!modelsCache) return;

  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(OPENROUTER_MODELS_CACHE_FILE), {
      recursive: true,
    });

    await fs.writeFile(
      OPENROUTER_MODELS_CACHE_FILE,
      JSON.stringify(modelsCache, null, 2),
      "utf-8",
    );
    logger.info("Saved OpenRouter models cache to file");
  } catch (error) {
    logger.error("Failed to save OpenRouter models cache:", error);
  }
}

/**
 * Check if the cache is expired
 */
function isCacheExpired(): boolean {
  if (!modelsCache) return true;

  const now = Date.now();
  return now - modelsCache.timestamp > OPENROUTER_CACHE_TTL;
}

/**
 * Check if we should throttle requests to prevent hitting rate limits
 */
function shouldThrottleRequests(): boolean {
  const now = Date.now();
  return now - lastRequestTimestamp < MIN_REQUEST_INTERVAL;
}

/**
 * Fetch models from OpenRouter API with rate limiting and caching
 */
export async function fetchOpenRouterModels(
  forceRefresh = false,
): Promise<any[]> {
  // Use cache if available and not expired, unless forced refresh
  if (modelsCache && !isCacheExpired() && !forceRefresh) {
    logger.info("Using cached OpenRouter models");
    // Handle both old and new cache formats
    if (Array.isArray(modelsCache.models)) {
      return modelsCache.models;
    } else if (modelsCache.models?.data && Array.isArray(modelsCache.models.data)) {
      return modelsCache.models.data;
    } else {
      logger.warn("Cache format is unexpected, forcing refresh");
      // Continue with refresh
    }
  }

  // Check if we need to throttle requests
  if (shouldThrottleRequests()) {
    logger.info("Throttling OpenRouter API request");

    // If cache exists, return it even if expired
    if (modelsCache) {
      logger.info("Using expired cache due to throttling");
      // Handle both old and new cache formats
      if (Array.isArray(modelsCache.models)) {
        return modelsCache.models;
      } else if (modelsCache.models?.data && Array.isArray(modelsCache.models.data)) {
        return modelsCache.models.data;
      } else {
        logger.warn("Cache format is unexpected but using as fallback");
        return Array.isArray(modelsCache.models) ? modelsCache.models : [];
      }
    }

    // If no cache, wait for the throttle period
    const waitTime = MIN_REQUEST_INTERVAL - (Date.now() - lastRequestTimestamp);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  try {
    // Update last request timestamp
    lastRequestTimestamp = Date.now();

    // Fetch from API
    logger.info("Fetching models from OpenRouter API");
    const response = await axios.get(
      "https://openrouter.ai/api/frontend/models",
      {
        headers: {
          "HTTP-Referer":
            process.env.OPENROUTER_REFERER || "https://discura.ai",
          "X-Title": "Discura Bot Platform",
        },
      },
    );

    // Extract models array from response, handling both old and new formats
    const modelsArray = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.data || []);

    logger.info(`Received ${modelsArray.length} models from OpenRouter API`);

    // Update cache, preserving the original structure for backward compatibility
    modelsCache = {
      timestamp: Date.now(),
      models: response.data,
    };

    // Save to disk
    await saveCache();

    return modelsArray;
  } catch (error) {
    logger.error("Error fetching OpenRouter models:", error);

    // If cache exists, return it even if expired
    if (modelsCache) {
      logger.info("Using expired cache due to API error");
      // Handle both old and new cache formats
      if (Array.isArray(modelsCache.models)) {
        return modelsCache.models;
      } else if (modelsCache.models?.data && Array.isArray(modelsCache.models.data)) {
        return modelsCache.models.data;
      } else {
        return [];
      }
    }

    // If no cache, return empty array
    return [];
  }
}

/**
 * Get model_variant_slug for a specific model from OpenRouter cache
 */
export async function getModelVariantSlug(
  modelId: string,
): Promise<string | undefined> {
  const models = await fetchOpenRouterModels();

  // Find the model in the list
  for (const model of models) {
    // Check model slug
    if (model.slug === modelId || model.permaslug === modelId) {
      // Find the model variant (usually standard or free)
      if (model.endpoint?.model_variant_slug) {
        return model.endpoint.model_variant_slug;
      }
    }

    // Check if this is a provider model ID format
    const [provider, providerModelId] = modelId.split("/");
    if (
      providerModelId &&
      model.author === provider &&
      model.provider_model_id === providerModelId
    ) {
      if (model.endpoint?.model_variant_slug) {
        return model.endpoint.model_variant_slug;
      }
    }
  }

  return undefined;
}

/**
 * Filter valid models from OpenRouter response
 */
export function filterValidModels(models: any[]): any[] {
  return models.filter((model) => {
    // Skip hidden models
    if (model.hidden) return false;

    // Skip models with no endpoint
    if (!model.endpoint) return false;

    // Skip disabled endpoints
    if (model.endpoint.is_disabled) return false;

    return true;
  });
}

/**
 * Group models by provider
 */
export function groupModelsByProvider(models: any[]): Record<string, any[]> {
  const result: Record<string, any[]> = {};

  for (const model of models) {
    // Use provider_name from the endpoint if available, otherwise fall back to author
    const provider = (model.endpoint?.provider_name || model.author || 'unknown').toLowerCase();

    if (!result[provider]) {
      result[provider] = [];
    }

    result[provider].push(model);
  }

  return result;
}

/**
 * Map OpenRouter provider name to our LLMProvider enum
 */
export function mapOpenRouterProviderToLLMProvider(
  providerName: string,
): LLMProvider {
  const nameMapping: Record<string, LLMProvider> = {
    // Major providers
    openai: LLMProvider.OPENAI,
    anthropic: LLMProvider.ANTHROPIC,
    google: LLMProvider.GOOGLE,
    groq: LLMProvider.GROQ,
    cohere: LLMProvider.COHERE,
    mistral: LLMProvider.MISTRAL,
    deepseek: LLMProvider.DEEPSEEK,
    fireworks: LLMProvider.FIREWORKS,
    perplexity: LLMProvider.PERPLEXITY,
    together: LLMProvider.TOGETHERAI,
    togetherai: LLMProvider.TOGETHERAI,
    meta: LLMProvider.HUGGINGFACE,
    "meta-llama": LLMProvider.HUGGINGFACE,
    llama: LLMProvider.HUGGINGFACE,
    microsoft: LLMProvider.AZURE,
    "aleph-alpha": LLMProvider.CUSTOM,
    cloudflare: LLMProvider.CUSTOM,
    bedrock: LLMProvider.AMAZON,
    amazon: LLMProvider.AMAZON,
    
    // Add OpenRouter gateway providers
    "anyscale": LLMProvider.CUSTOM,
    "voyage": LLMProvider.CUSTOM,
    "openrouter": LLMProvider.OPENROUTER,
    "deepinfra": LLMProvider.DEEPINFRA,
    "chutes": LLMProvider.CHUTES, // Fixed: Now properly mapped to LLMProvider.CHUTES
    "replicate": LLMProvider.CUSTOM,
    "qwen": LLMProvider.CUSTOM,
    "lmstudio": LLMProvider.CUSTOM,
    "nous": LLMProvider.CUSTOM,
    "nousresearch": LLMProvider.CUSTOM,
  };

  const providerNameLower = providerName.toLowerCase();
  const mappedProvider = nameMapping[providerNameLower] || LLMProvider.CUSTOM;
  
  // Add debug logging for Chutes provider mapping
  if (providerNameLower === "chutes" || mappedProvider === LLMProvider.CHUTES) {
    logger.info(`Mapping provider "${providerName}" to ${mappedProvider}`);
  }

  return mappedProvider;
}

/**
 * Convert OpenRouter model to our EnhancedLLMModelData format
 */
export function convertOpenRouterModelToEnhancedModel(model: any) {
  // Use endpoint info if available (for better provider information)
  const endpoint = model.endpoint || {};
  
  // Extract capabilities based on available fields
  const capabilities = {
    input_modalities: model.input_modalities || ["text"],
    output_modalities: model.output_modalities || ["text"],
    supports_streaming: true,
    supports_tool_calling: endpoint.supports_tool_parameters || false,
    supports_vision: (model.input_modalities || []).includes("image") || false,
  };

  // Use provider_name from endpoint for accurate provider identification
  const providerName = endpoint.provider_name || model.author || "unknown";
  
  // Use provider_model_id from endpoint for Vercel AI SDK integration
  const providerModelId = endpoint.provider_model_id || model.hf_slug || model.slug;

  // For debugging
  logger.debug(`Converting OpenRouter model: 
    slug: ${model.slug}, 
    provider: ${providerName}, 
    model_id: ${providerModelId}`);
  
  return {
    id: model.slug,
    object: "model",
    created: new Date(model.created_at || Date.now()).getTime() / 1000,
    owned_by: providerName,
    display_name: model.short_name || model.name,
    provider_model_id: providerModelId,
    context_length: model.context_length || 4096,
    capabilities,
    // Additional useful metadata
    pricing: endpoint.pricing ? {
      prompt_tokens: parseFloat(endpoint.pricing.prompt || "0"),
      completion_tokens: parseFloat(endpoint.pricing.completion || "0"),
    } : undefined,
    model_variant_slug: endpoint.model_variant_slug,
    provider_display_name: endpoint.provider_display_name
  };
}
