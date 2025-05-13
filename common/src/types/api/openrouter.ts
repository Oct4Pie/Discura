/**
 * OpenRouter API Types
 *
 * Types for the OpenRouter API integration - following the single source of truth principle.
 */

/**
 * OpenRouter Model Response
 * @tsoaModel
 */
export interface OpenRouterModelResponse {
  data: OpenRouterModel[];
}

/**
 * OpenRouter Model Object
 * @tsoaModel
 */
export interface OpenRouterModel {
  slug: string;
  hf_slug?: string | null;
  updated_at: string;
  created_at: string;
  hf_updated_at?: string | null;
  name: string;
  short_name: string;
  author: string;
  description: string;
  model_version_group_id?: string | null;
  context_length: number;
  input_modalities: string[];
  output_modalities: string[];
  has_text_output: boolean;
  group: string;
  instruct_type?: string | null;
  default_system?: string | null;
  default_stops: string[];
  hidden: boolean;
  router?: any | null;
  warning_message?: string | null;
  permaslug: string;
  reasoning_config?: any | null;
  features?: Record<string, any>;
  endpoint: OpenRouterEndpoint;
}

/**
 * OpenRouter Endpoint Object
 * @tsoaModel
 */
export interface OpenRouterEndpoint {
  id: string;
  name: string;
  context_length: number;
  model: OpenRouterModel;
  model_variant_slug: string;
  model_variant_permaslug: string;
  provider_name: string;
  provider_info: OpenRouterProviderInfo;
  provider_display_name: string;
  provider_model_id: string;
  provider_group: string;
  quantization?: string | null;
  variant: string;
  is_free: boolean;
  can_abort: boolean;
  max_prompt_tokens?: number | null;
  max_completion_tokens?: number | null;
  max_prompt_images?: number | null;
  max_tokens_per_image?: number | null;
  supported_parameters: string[];
  is_byok: boolean;
  moderation_required: boolean;
  data_policy: OpenRouterDataPolicy;
  pricing: OpenRouterPricing;
  variable_pricings: OpenRouterVariablePricing[];
  is_hidden: boolean;
  is_deranked: boolean;
  is_disabled: boolean;
  supports_tool_parameters: boolean;
  supports_reasoning: boolean;
  supports_multipart: boolean;
  limit_rpm?: number | null;
  limit_rpd?: number | null;
  has_completions: boolean;
  has_chat_completions: boolean;
  features: Record<string, any>;
  provider_region?: string | null;
}

/**
 * OpenRouter Provider Info
 * @tsoaModel
 */
export interface OpenRouterProviderInfo {
  name: string;
  displayName: string;
  slug: string;
  baseUrl: string;
  dataPolicy: OpenRouterDataPolicy;
  headquarters?: string | null;
  hasChatCompletions: boolean;
  hasCompletions: boolean;
  isAbortable: boolean;
  moderationRequired: boolean;
  group: string;
  editors: string[];
  owners: string[];
  isMultipartSupported: boolean;
  statusPageUrl?: string | null;
  byokEnabled: boolean;
  isPrimaryProvider: boolean;
  icon: {
    url: string;
  };
}

/**
 * OpenRouter Data Policy
 * @tsoaModel
 */
export interface OpenRouterDataPolicy {
  termsOfServiceURL: string | null;
  privacyPolicyURL?: string | null;
  paidModels?: {
    training: boolean;
    retainsPrompts: boolean;
    retentionDays?: number | null;
  };
  freeModels?: {
    training: boolean;
    retainsPrompts: boolean;
    retentionDays?: number | null;
  };
  training?: boolean;
  retainsPrompts?: boolean;
  retentionDays?: number | null;
}

/**
 * OpenRouter Pricing
 * @tsoaModel
 */
export interface OpenRouterPricing {
  prompt: string;
  completion: string;
  image?: string;
  request?: string;
  web_search?: string;
  internal_reasoning?: string;
  input_cache_read?: string | null;
  input_cache_write?: string | null;
  discount: number;
}

/**
 * OpenRouter Variable Pricing
 * @tsoaModel
 */
export interface OpenRouterVariablePricing {
  type: string;
  threshold: number;
  prompt: string;
  completions: string;
  input_cache_read?: string | null;
  input_cache_write?: string | null;
}
