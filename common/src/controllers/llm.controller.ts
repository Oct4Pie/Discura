import {
  Controller,
  Body,
  Get,
  Post,
  Route,
  Security,
  Tags,
  Request,
  Response,
  Path,
} from "tsoa";
import {
  LLMModelData,
  LLMModelsResponseDto,
  LLMCompletionMessage,
  LLMCompletionRequestDto,
  LLMCompletionResponseDto,
  ErrorResponseDto,
  LLMProvider,
} from "../types";
import { Request as ExpressRequest } from "express";

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
    @Request() request: ExpressRequest
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
    @Path("provider") provider: LLMProvider
  ): Promise<{ available: boolean }> {
    // Implementation will be provided by backend
    // This parameter explicitly uses LLMProvider to ensure it's included in generated types
    throw new Error("Method not implemented in common package");
  }
}
