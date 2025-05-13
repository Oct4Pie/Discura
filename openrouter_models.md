This document provides a concise overview of the data structure for a single model object from the OpenRouter API endpoint `https://openrouter.ai/api/frontend/models`.

**Key Format:**
* **`key_name`**: `type` (`Optionality`*) - Meaning. *Example: `value`*
    * `Optionality`:
        * `(Optional)`: The key itself may not be present, or its value can be `null`/empty default.
        * `type | null`: The key is generally present, but its value can be `null`.

---

**Root Model Object**
Represents a single AI model.

* **`slug`**: `string` - Unique URL-friendly model ID. *E.g., `"nousresearch/deephermes-3-mistral-24b-preview"`*
* **`hf_slug`**: `string | null` (Optional) - Corresponding Hugging Face slug. *E.g., `"NousResearch/DeepHermes-3-Mistral-24B-Preview"`*
* **`updated_at`**: `string (ISO 8601 datetime)` - Last update timestamp on OpenRouter.
* **`created_at`**: `string (ISO 8601 datetime)` - Creation timestamp on OpenRouter.
* **`hf_updated_at`**: `string (ISO 8601 datetime) | null` (Optional) - Hugging Face model update timestamp.
* **`name`**: `string` - Full human-readable model name. *E.g., `"Nous: DeepHermes 3 Mistral 24B Preview (free)"`*
* **`short_name`**: `string` - Concise model name. *E.g., `"DeepHermes 3 Mistral 24B Preview (free)"`*
* **`author`**: `string` - Model creator or organization. *E.g., `"nousresearch"`*
* **`description`**: `string` - Detailed model description and capabilities.
* **`model_version_group_id`**: `string | null` (Optional) - Identifier for a group of related model versions.
* **`context_length`**: `number (integer)` - Maximum tokens (prompt + completion) the model can process. *E.g., `32768`*
* **`input_modalities`**: `array of strings` - Accepted input types. *E.g., `["text"]`, `["text", "image"]`*
* **`output_modalities`**: `array of strings` - Generated output types. *E.g., `["text"]`*
* **`has_text_output`**: `boolean` - Indicates if the model produces text output.
* **`group`**: `string` - Model category or family. *E.g., `"Other"`, `"Mistral"`*
* **`instruct_type`**: `string | null` (Optional) - Instruction format style if applicable (e.g., "alpaca").
* **`default_system`**: `string | null` (Optional) - Suggested default system prompt.
* **`default_stops`**: `array of strings` (Can be empty) - Default stop sequences for generation.
* **`hidden`**: `boolean` - If true, model is hidden from default UI listings.
* **`router`**: `object | null` (Optional) - OpenRouter internal routing configuration; structure varies.
* **`warning_message`**: `string | null` (Optional) - Important notes or warnings for the model.
* **`permaslug`**: `string` - A permanent, stable slug for API referencing.
* **`reasoning_config`**: `object | null` (Optional) - Configuration for special reasoning capabilities; structure varies.
* **`features`**: `object` (Often empty) - Miscellaneous model features or flags; structure varies.
* **`endpoint`**: `object` - **Core object defining provider-specific access. Detailed below.**

---

**`endpoint` Object**
Details for a specific API endpoint variant of the model.

* **`id`**: `string (UUID)` - Unique identifier for this endpoint.
* **`name`**: `string` - Descriptive name of the endpoint. *E.g., `"Chutes | nousresearch/deephermes-3-mistral-24b-preview:free"`*
* **`context_length`**: `number (integer)` - Context length for this endpoint.
* **`model`**: `object` - Base model information; **structure mirrors the Root Model Object**.
* **`model_variant_slug`**: `string` - Slug for this specific model variant. *E.g., `"nousresearch/deephermes-3-mistral-24b-preview:free"`*
* **`model_variant_permaslug`**: `string` - Permanent slug for this model variant.
* **`provider_name`**: `string` - Canonical name of the API provider. *E.g., `"Chutes"`, `"Mistral"`*
* **`provider_info`**: `object` - Detailed information about the provider.
    * **`name`**: `string` - Provider's canonical name.
    * **`displayName`**: `string` - Provider's display name.
    * **`slug`**: `string` - Provider's URL-friendly slug.
    * **`baseUrl`**: `string` - Provider's API base URL (often a placeholder like `"url"` in this frontend data).
    * **`dataPolicy`**: `object` - Provider's data handling policies.
        * **`termsOfServiceURL`**: `string | null` - Link to Terms of Service.
        * **`privacyPolicyURL`**: `string | null` (Optional) - Link to Privacy Policy.
        * **`paidModels`**: `object` - Policy for paid models.
            * **`training`**: `boolean` - If data is used for training.
            * **`retainsPrompts`**: `boolean` - If prompts are retained.
            * **`retentionDays`**: `number (integer) | null` (Optional) - Prompt retention period.
        * **`freeModels`**: `object` (Optional) - Policy for free models. (Structure similar to `paidModels`).
    * **`headquarters`**: `string | null` - Provider's HQ country code (e.g., "US", "FR").
    * **`hasChatCompletions`**: `boolean` - Supports chat completions API.
    * **`hasCompletions`**: `boolean` - Supports legacy completions API.
    * **`isAbortable`**: `boolean` - If requests can be aborted.
    * **`moderationRequired`**: `boolean` - If provider requires content moderation.
    * **`group`**: `string` - Provider group.
    * **`editors`**: `array of strings` (Internal use) - IDs of editors.
    * **`owners`**: `array of strings` (Internal use) - IDs of owners.
    * **`isMultipartSupported`**: `boolean` - Supports multipart requests (e.g., file uploads).
    * **`statusPageUrl`**: `string | null` (Optional) - Provider's status page URL.
    * **`byokEnabled`**: `boolean` - If "Bring Your Own Key" is supported.
    * **`isPrimaryProvider`**: `boolean` - If considered a primary provider by OpenRouter.
    * **`icon`**: `object` - Provider icon details.
        * **`url`**: `string` - URL of the icon image.
* **`provider_display_name`**: `string` - Provider's name for display.
* **`provider_model_id`**: `string` - Model ID used by the provider. *E.g., `"NousResearch/DeepHermes-3-Mistral-24B-Preview"`*
* **`provider_group`**: `string` - Group associated with the provider for this endpoint.
* **`quantization`**: `string | null` (Optional) - Model quantization type. *E.g., `"4-bit"`, `"GGUF"`*
* **`variant`**: `string` - Specific variant of the model. *E.g., `"free"`, `"standard"`*
* **`is_free`**: `boolean` - If this endpoint variant is free.
* **`can_abort`**: `boolean` - If requests to this specific endpoint can be aborted.
* **`max_prompt_tokens`**: `number (integer) | null` (Optional) - Max prompt tokens for this endpoint.
* **`max_completion_tokens`**: `number (integer) | null` (Optional) - Max completion tokens for this endpoint.
* **`max_prompt_images`**: `number (integer) | null` (Optional) - Max images in prompt (for multimodal).
* **`max_tokens_per_image`**: `number (integer) | null` (Optional) - Token cost/limit per image.
* **`supported_parameters`**: `array of strings` - API parameters supported by this endpoint. *E.g., `["max_tokens", "temperature"]`*
* **`is_byok`**: `boolean` - If "Bring Your Own Key" is used for this endpoint.
* **`moderation_required`**: `boolean` - If moderation is required for this endpoint.
* **`data_policy`**: `object` - Endpoint-specific data policy (overrides/augments `provider_info.dataPolicy`).
    * **`termsOfServiceURL`**: `string | null`
    * **`privacyPolicyURL`**: `string | null` (Optional)
    * **`paidModels`**: `object` (Optional) (Structure as in `provider_info.dataPolicy.paidModels`)
    * **`freeModels`**: `object` (Optional) (Structure as in `provider_info.dataPolicy.freeModels`)
    * **`training`**: `boolean` - If data from this specific endpoint is used for training.
    * **`retainsPrompts`**: `boolean` - If this specific endpoint retains prompts.
    * **`retentionDays`**: `number (integer) | null` (Optional) - Endpoint-specific retention period.
* **`pricing`**: `object` - Pricing details for this endpoint.
    * **`prompt`**: `string` (decimal as string) - Cost for input tokens. *E.g., `"0.00000125"`*
    * **`completion`**: `string` (decimal as string) - Cost for output tokens. *E.g., `"0.00001"`*
    * **`image`**: `string` (decimal as string, Optional) - Cost per image.
    * **`request`**: `string` (decimal as string, Optional) - Cost per request.
    * **`web_search`**: `string` (decimal as string, Optional) - Cost for web search feature.
    * **`internal_reasoning`**: `string` (decimal as string, Optional) - Cost for internal reasoning steps.
    * **`input_cache_read`**: `string | null` (decimal as string, Optional) - Cost for cached input reads.
    * **`input_cache_write`**: `string | null` (decimal as string, Optional) - Cost for cached input writes.
    * **`discount`**: `number (float)` - Discount percentage (0 for none).
* **`variable_pricings`**: `array of objects` (Can be empty) - Tiered or conditional pricing.
    * **`type`**: `string` - Type of condition. *E.g., `"prompt-threshold"`*
    * **`threshold`**: `number (integer)` - Threshold for this tier.
    * **`prompt`**: `string` (decimal as string) - Tier-specific prompt cost.
    * **`completions`**: `string` (decimal as string) - Tier-specific completion cost. (Note: key is `completions`)
    * **`input_cache_read`**: `string | null` (Optional)
    * **`input_cache_write`**: `string | null` (Optional)
* **`is_hidden`**: `boolean` - If this endpoint variant is hidden in UIs.
* **`is_deranked`**: `boolean` - If this endpoint is de-ranked in sorted lists.
* **`is_disabled`**: `boolean` - If this endpoint is currently disabled.
* **`supports_tool_parameters`**: `boolean` - Supports tool use/function calling parameters.
* **`supports_reasoning`**: `boolean` - Supports specific reasoning features.
* **`supports_multipart`**: `boolean` - Supports multipart requests.
* **`limit_rpm`**: `number (integer) | null` (Optional) - Rate limit: Requests Per Minute.
* **`limit_rpd`**: `number (integer) | null` (Optional) - Rate limit: Requests Per Day.
* **`has_completions`**: `boolean` - If endpoint supports legacy `/completions` API.
* **`has_chat_completions`**: `boolean` - If endpoint supports `/chat/completions` API.
* **`features`**: `object` (Often empty) - Endpoint-specific features.
    * **`supported_parameters`**: `object` (Optional, often empty) - Detailed parameter support.
    * **`supports_document_url`**: `boolean | null` (Optional) - If model can process documents via URL.
* **`provider_region`**: `string | null` (Optional) - Geographical region of the provider endpoint. *E.g., `"us-east-1"`*