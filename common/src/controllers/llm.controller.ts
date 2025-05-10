import {
  Controller,
  Body,
  Get,
  Post,
  Route,
  Security,
  Tags,
  Request,
  Response
} from "tsoa";
import { ROUTES } from "../types/routes";
import {
  LLMModelData,
  LLMModelsResponseDto,
  LLMCompletionMessage,
  LLMCompletionRequestDto,
  LLMCompletionResponseDto,
  LLMProvider,
  ErrorResponseDto
 } from "../schema/types";
import { Request as ExpressRequest } from "express";

/**
 * LLM Controller
 *
 * Provides endpoints for interacting with large language models through
 * a standardized interface compatible with OpenAI API format.
 */
@Route(ROUTES.LLM)
@Tags("LLM")
export class LLMController extends Controller {
  /**
   * List available LLM models
   *
   * Returns a list of the available models sorted by creation date.
   * Models may vary based on system configuration and user permissions.
   */
  @Get(ROUTES.LLM_ENDPOINTS.MODELS)
  @Security("jwt")
  @Response<ErrorResponseDto>(500, 'Server Error')
  public async getModels(): Promise<LLMModelsResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
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
  @Post(ROUTES.LLM_ENDPOINTS.COMPLETION)
  @Security("jwt")
  @Response<ErrorResponseDto>(400, 'Invalid Request')
  @Response<ErrorResponseDto>(500, 'Server Error')
  public async createChatCompletion(
    @Body() requestBody: LLMCompletionRequestDto,
    @Request() request: ExpressRequest
  ): Promise<LLMCompletionResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
}