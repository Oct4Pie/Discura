import { Request as ExpressRequest } from "express";
import {
  Controller,
  Body,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Security,
  Tags,
  Request,
  Response,
  Path,
  Hidden,
} from "tsoa";

import {
  LLMModelData,
  LLMModelsResponseDto,
  LLMCompletionMessage,
  LLMCompletionRequestDto,
  LLMCompletionResponseDto,
  ErrorResponseDto,
  LLMProvider,
  LLMResponse,
  ProviderModelsResponseDto,
  AllProviderModelsResponseDto,
  CustomProviderConfig,
  TokenValidationResult,
  ProviderRegistryConfiguration,
  ProviderConfiguration,
} from "../types/api";

/**
 * LLM Controller
 *
 * Provides endpoints for interacting with large language models through
 * a standardized interface compatible with OpenAI API format.
 *
 * IMPORTANT: The route string 'llm' matches BASE_ROUTES.LLM in routes.constants.ts
 * This string literal MUST be kept in sync with that constant.
 */
@Route("llm")
@Tags("LLM")
export class LLMController extends Controller {
  /**
   * List available LLM models
   *
   * Returns a list of the available models sorted by creation date.
   * Models may vary based on system configuration and user permissions.
   */
  @Get("models")
  @Security("jwt")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async getModels(): Promise<LLMModelsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Create a chat completion
   *
   * Creates a completion for the chat message. This endpoint is compatible
   * with the OpenAI Chat API format but can work with multiple LLM providers.
   *
   * The completion includes choices which contain generated messages from the model.
   * Response format can be controlled by the request parameters.
   */
  @Post("chat/completions")
  @Security("jwt")
  @Response<ErrorResponseDto>(400, "Invalid Request")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async createChatCompletion(
    @Body() requestBody: LLMCompletionRequestDto,
    @Request() request: ExpressRequest,
  ): Promise<LLMCompletionResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get available LLM providers
   *
   * Returns the list of supported LLM providers in the system.
   * This helps clients know which providers are available.
   */
  @Get("providers")
  @Security("jwt")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async getProviders(): Promise<{ providers: LLMProvider[] }> {
    // This endpoint explicitly uses LLMProvider to ensure it's included in generated types
    return {
      providers: [
        LLMProvider.OPENAI,
        LLMProvider.ANTHROPIC,
        LLMProvider.GOOGLE,
        LLMProvider.GROQ,
        LLMProvider.COHERE,
        LLMProvider.DEEPSEEK,
        LLMProvider.MISTRAL,
        LLMProvider.AMAZON,
        LLMProvider.AZURE,
        LLMProvider.FIREWORKS,
        LLMProvider.TOGETHERAI,
        LLMProvider.PERPLEXITY,
        LLMProvider.DEEPINFRA,
        LLMProvider.XAI,
        LLMProvider.OLLAMA,
        LLMProvider.HUGGINGFACE,
        LLMProvider.CEREBRAS,
        LLMProvider.ELEVENLABS,
        LLMProvider.GLADIA,
        LLMProvider.ASSEMBLYAI,
        LLMProvider.REVAI,
        LLMProvider.DEEPGRAM,
        LLMProvider.LMNT,
        LLMProvider.HUME,
        LLMProvider.OPENROUTER,
        LLMProvider.CUSTOM,
      ],
    };
  }

  /**
   * Check if a specific provider is available
   *
   * Validates if the requested LLM provider is supported and available.
   */
  @Get("providers/{provider}")
  @Security("jwt")
  @Response<ErrorResponseDto>(404, "Provider Not Found")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async checkProviderAvailability(
    @Path("provider") provider: LLMProvider,
  ): Promise<{ available: boolean }> {
    // Implementation will be provided by backend
    // This parameter explicitly uses LLMProvider to ensure it's included in generated types
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get models for a specific provider
   *
   * Returns the models available for the specified provider.
   * Results are cached to avoid rate limiting but will be refreshed
   * if the cache is too old.
   */
  @Get("providers/{provider}/models")
  @Security("jwt")
  @Response<ErrorResponseDto>(404, "Provider Not Found")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async getProviderModels(
    @Path("provider") provider: LLMProvider,
  ): Promise<ProviderModelsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get models for all available providers
   *
   * Returns models available for all providers in the system.
   * Results are cached to avoid rate limiting but will be refreshed
   * if the cache is too old.
   */
  @Get("models/all-providers")
  @Security("jwt")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async getAllProviderModels(): Promise<AllProviderModelsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Force refresh models for a provider
   *
   * Forces a refresh of the model cache for the specified provider.
   * This will make a new API call to the provider to get the latest models.
   */
  @Post("providers/{provider}/models/refresh")
  @Security("jwt")
  @Response<ErrorResponseDto>(404, "Provider Not Found")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async refreshProviderModels(
    @Path("provider") provider: LLMProvider,
  ): Promise<ProviderModelsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Enable or disable a provider
   *
   * Updates the status of a provider to either enabled or disabled.
   * Providers must be enabled to be used in the system.
   */
  @Put("providers/{provider}/status")
  @Security("jwt")
  @Response<ErrorResponseDto>(404, "Provider Not Found")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async updateProviderStatus(
    @Path("provider") provider: LLMProvider,
    @Body() requestBody: { enabled: boolean },
  ): Promise<{ success: boolean; provider: LLMProvider; enabled: boolean }> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Configure a custom provider
   *
   * Adds or updates a custom provider configuration.
   * Custom providers must follow the OpenAI-compatible API format.
   */
  @Post("providers/custom")
  @Security("jwt")
  @Response<ErrorResponseDto>(400, "Invalid Provider Configuration")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async configureCustomProvider(
    @Body() requestBody: CustomProviderConfig,
  ): Promise<{ success: boolean; provider: CustomProviderConfig }> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Remove a custom provider
   *
   * Removes a custom provider from the system by name.
   */
  @Delete("providers/custom/{name}")
  @Security("jwt")
  @Response<ErrorResponseDto>(404, "Provider Not Found")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async removeCustomProvider(
    @Path("name") name: string,
  ): Promise<{ success: boolean; removed: boolean }> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * This method is only used to expose internal types to TSOA for generation purposes.
   * It will never be called in production code and is hidden from the API documentation.
   *
   * This is a common pattern to ensure types are included in the generated API types.
   */
  @Hidden()
  @Post("internal/types-exposure")
  @Security("jwt", ["admin"])
  @Response<ErrorResponseDto>(403, "Forbidden")
  public async exposeInternalTypesForTsoa(
    @Body()
    requestBody: {
      tokenValidation: TokenValidationResult;
      providerRegistry: ProviderRegistryConfiguration;
      providerConfig: ProviderConfiguration;
    },
  ): Promise<{
    tokenValidation: TokenValidationResult;
    providerRegistry: ProviderRegistryConfiguration;
    providerConfig: ProviderConfiguration;
  }> {
    // This method should only contain type definitions, not implementation
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get direct LLM response from a provider
   *
   * This endpoint is used to get a direct response from a provider.
   * It's intended for internal use and is hidden from the API documentation.
   */
  @Hidden()
  @Post("direct-response")
  @Security("jwt")
  @Response<ErrorResponseDto>(400, "Invalid Request")
  @Response<ErrorResponseDto>(500, "Server Error")
  public async getDirectLLMResponse(
    @Body()
    requestBody: {
      provider: LLMProvider;
      prompt: string;
      model?: string;
    },
  ): Promise<LLMResponse> {
    // This method ensures LLMResponse is included in generated types
    throw new Error("Method not implemented in common package");
  }
}
