/**
 * LLM API Types
 *
 * This file contains all API types related to the LLM service.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

/**
 * LLM Provider Enum - Supported providers
 * @tsoaModel
 */
export enum LLMProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  GROQ = "groq",
  COHERE = "cohere",
  DEEPSEEK = "deepseek",
  MISTRAL = "mistral",
  AMAZON = "amazon",
  AZURE = "azure",
  FIREWORKS = "fireworks",
  TOGETHERAI = "togetherai",
  PERPLEXITY = "perplexity",
  DEEPINFRA = "deepinfra",
  XAI = "xai",
  OLLAMA = "ollama",
  HUGGINGFACE = "huggingface",
  CEREBRAS = "cerebras",
  ELEVENLABS = "elevenlabs",
  GLADIA = "gladia",
  ASSEMBLYAI = "assemblyai",
  REVAI = "revai",
  DEEPGRAM = "deepgram",
  LMNT = "lmnt",
  HUME = "hume",
  OPENROUTER = "openrouter",
  CHUTES = "chutes",
  CUSTOM = "custom",
}

/**
 * LLM Model Data Structure
 * @tsoaModel
 */
export interface LLMModelData {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  display_name: string; // Required now
  provider_model_id: string; // Required now, ID used by the provider's API
  capabilities?: ModelCapabilities;
  context_length?: number;
  pricing?: ModelPricing;
  max_tokens?: number;
}

/**
 * LLM Models Response
 * @tsoaModel
 */
export interface LLMModelsResponseDto {
  object: string;
  data: LLMModelData[];
}

/**
 * Model pricing information
 * @tsoaModel
 */
export interface ModelPricing {
  prompt_tokens: number;
  completion_tokens: number;
  currency?: string;
}

/**
 * Model capabilities and features
 * @tsoaModel
 */
export interface ModelCapabilities {
  input_modalities: string[];
  output_modalities: string[];
  supports_tool_calling?: boolean;
  supports_streaming?: boolean;
  supports_vision?: boolean;
}

/**
 * Custom Provider Configuration
 * @tsoaModel
 */
export interface CustomProviderConfig {
  name: string;
  endpoint_url: string;
  api_key_env_var: string;
  models: LLMModelData[];
}

/**
 * Provider Models Response - Contains models available for a specific provider
 * @tsoaModel
 */
export interface ProviderModelsResponseDto {
  provider: LLMProvider;
  provider_display_name: string;
  models: LLMModelData[]; // Changed from EnhancedLLMModelData to LLMModelData
  last_updated: number; // timestamp when models were last fetched from provider
}

/**
 * All Provider Models Response - Contains models for all available providers
 * @tsoaModel
 */
export interface AllProviderModelsResponseDto {
  providers: ProviderModelsResponseDto[];
}

/**
 * Provider Configuration - Used to enable/disable and configure providers
 * @tsoaModel
 */
export interface ProviderConfiguration {
  enabled: boolean;
  config?: Record<string, any>;
  custom_providers?: CustomProviderConfig[];
}

/**
 * Provider Registry Configuration - Contains configuration for all providers
 * @tsoaModel
 */
export interface ProviderRegistryConfiguration {
  providers: Record<LLMProvider, ProviderConfiguration>;
}

/**
 * LLM Completion Message
 * @tsoaModel
 */
export interface LLMCompletionMessage {
  role: string;
  content: string;
  name?: string;
}

/**
 * LLM Completion Request
 * @tsoaModel
 */
export interface LLMCompletionRequestDto {
  model: string; // If provider is specified, this is the model_id.
  // If provider is OPENROUTER or null/undefined, this is treated as a slug for OpenRouter.
  provider?: LLMProvider; // Optional: The specific LLMProvider to use
  messages: LLMCompletionMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

/**
 * LLM Completion Response Choice
 * @tsoaModel
 */
export interface LLMCompletionResponseChoice {
  index: number;
  message: LLMCompletionMessage;
  finish_reason: string;
}

/**
 * LLM Completion Response Usage
 * @tsoaModel
 */
export interface LLMCompletionResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * LLM Completion Response
 * @tsoaModel
 */
export interface LLMCompletionResponseDto {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LLMCompletionResponseChoice[];
  usage: LLMCompletionResponseUsage;
}

/**
 * Token Validation Result
 * @tsoaModel
 */
export interface TokenValidationResult {
  valid: boolean;
  messageContentEnabled: boolean;
  botId?: string;
  username?: string;
  error?: string;
}

/**
 * LLM Response data
 * @tsoaModel
 */
export interface LLMResponse {
  text: string;
  generateImage?: boolean;
  imagePrompt?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    type?: string;
    content?: string;
  }>;
}
