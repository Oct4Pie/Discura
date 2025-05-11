import { CONTROLLER_ROUTES, BASE_ROUTES, BOT_PATHS } from '../types/routes';
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
  Request
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import {
  BotStatus,
  ErrorResponseDto,
  MessageResponseDto,
  KnowledgeItemDto,
  KnowledgeBaseResponseDto
  } from "../types/api";

/**
 * Knowledge Base Controller
 * 
 * Provides endpoints for managing bot knowledge bases, allowing users to
 * add, update, and delete knowledge items that bots can reference during conversations.
 * 
 * IMPORTANT: We use the string literals directly in the decorators
 * because TSOA doesn't properly resolve imported constants during generation.
 * These strings MUST match the constants in routes.constants.ts
 */
@Route("bots")
@Tags('Knowledge')
export class KnowledgeController extends Controller {
  /**
   * Get all knowledge items for a specific bot
   * 
   * @param botId The unique identifier of the bot
   */
  @Get('{botId}/knowledge')
  @Security('jwt')
  public async getKnowledgeItems(
    @Path('botId') botId: string,
    @Request() request: ExpressRequest
  ): Promise<KnowledgeBaseResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
  
  /**
   * Add a new knowledge item to a bot
   * 
   * @param botId The unique identifier of the bot
   */
  @Post('{botId}/knowledge')
  @Security('jwt')
  public async addKnowledgeItem(
    @Path('botId') botId: string,
    @Body() item: {
      title: string;
      content: string;
      type: string;
      priority?: number;
    },
    @Request() request: ExpressRequest
  ): Promise<KnowledgeItemDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
  
  /**
   * Update a knowledge item
   * 
   * @param botId The unique identifier of the bot
   * @param itemId The unique identifier of the knowledge item
   */
  @Put('{botId}/knowledge/{itemId}')
  @Security('jwt')
  public async updateKnowledgeItem(
    @Path('botId') botId: string,
    @Path('itemId') itemId: string,
    @Body() item: {
      title?: string;
      content?: string;
      type?: string;
      priority?: number;
    },
    @Request() request: ExpressRequest
  ): Promise<KnowledgeItemDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
  
  /**
   * Delete a knowledge item
   * 
   * @param botId The unique identifier of the bot
   * @param itemId The unique identifier of the knowledge item
   */
  @Delete('{botId}/knowledge/{itemId}')
  @Security('jwt')
  public async deleteKnowledgeItem(
    @Path('botId') botId: string,
    @Path('itemId') itemId: string,
    @Request() request: ExpressRequest
  ): Promise<MessageResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
}