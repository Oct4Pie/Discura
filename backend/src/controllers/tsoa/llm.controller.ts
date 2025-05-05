// src/controllers/tsoa/llm.controller.ts
import { 
  ErrorResponseDto, 
  LLMCompletionRequestDto, 
  LLMCompletionResponseDto, 
  LLMModelsResponseDto
} from '@common/types/api';
import { CONTROLLER_ROUTES, ROUTES } from '@common/types/routes';
import {
  Body,
  Controller,
  Get,
  Post,
  Route,
  Security,
  Tags
} from 'tsoa';
import { logger } from '../../utils/logger';
import * as LLMService from '../../services/llm.service';

/**
 * LLM Controller that provides OpenAI-compatible endpoints for interacting with 
 * large language models. This controller supports various LLM providers through
 * a standardized interface.
 */
@Route(CONTROLLER_ROUTES.LLM)
@Tags('LLM')
export class LLMController extends Controller {
  
  /**
   * List available LLM models
   * 
   * Returns a list of the available models sorted by creation date.
   * Models may vary based on system configuration and user permissions.
   */
  @Get(ROUTES.LLM_ENDPOINTS.MODELS)
  @Security('jwt')
  public async getModels(): Promise<LLMModelsResponseDto> {
    try {
      // Get models from service
      const models = await LLMService.listModels();
      
      return {
        object: "list",
        data: models
      };
    } catch (error) {
      logger.error('Get LLM models error:', error);
      this.setStatus(500);
      throw new Error('Failed to retrieve LLM models');
    }
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
  @Security('jwt')
  public async createChatCompletion(
    @Body() requestBody: LLMCompletionRequestDto
  ): Promise<LLMCompletionResponseDto> {
    try {
      // For demonstration purposes only - in a real application, 
      // we would get the user ID from the JWT token
      const userId = "demo-user";
      
      // Validate required fields
      if (!requestBody.model || !requestBody.messages || requestBody.messages.length === 0) {
        this.setStatus(400);
        throw new Error('Model and messages are required');
      }

      // Generate completion
      const result = await LLMService.createChatCompletion(requestBody, userId);
      
      return result;
    } catch (error) {
      logger.error('LLM chat completion error:', error);
      
      if (error instanceof Error && error.message.includes('required')) {
        this.setStatus(400);
        throw new Error('Invalid request: ' + error.message);
      }
      
      this.setStatus(500);
      throw new Error('Failed to create chat completion');
    }
  }
}