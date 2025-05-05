/**
 * Knowledge Base Controller
 * 
 * Provides endpoints for managing bot knowledge bases, allowing users to
 * add, update, and delete knowledge items that bots can reference during conversations.
 */
import { BotStatus } from '@common/types';
import { CONTROLLER_ROUTES } from '@common/types/routes';
import {
  BotResponseDto,
  ErrorResponseDto,
  MessageResponseDto
} from '@common/types/api';
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
import { BotAdapter } from '../../models/adapters/bot.adapter';
import { KnowledgeAdapter, KnowledgeItemDto } from '../../models/adapters/knowledge.adapter';
import { logger } from '../../utils/logger';
import { JwtPayload } from '../../types/express';

// Response DTO for knowledge items
interface KnowledgeBaseResponseDto {
  botId: string;
  items: KnowledgeItemDto[];
}

/**
 * Knowledge Base Controller
 * Manages knowledge items for Discord bots
 */
@Route('bots/{botId}/knowledge')
@Tags('Knowledge')
export class KnowledgeController extends Controller {
  /**
   * Get all knowledge items for a specific bot
   * 
   * @param botId The unique identifier of the bot
   */
  @Get('/')
  @Security('jwt')
  public async getKnowledgeItems(
    @Path('botId') botId: string,
    @Request() request: ExpressRequest
  ): Promise<KnowledgeBaseResponseDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Check if bot exists and belongs to the user
      const bot = await BotAdapter.findById(botId);
      
      if (!bot || bot.user !== userId) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Get knowledge items from the adapter
      const knowledgeItems = await KnowledgeAdapter.findByBotId(botId);
      
      return {
        botId: botId,
        items: knowledgeItems.map(item => item.toDTO())
      };
    } catch (error) {
      logger.error(`Error getting knowledge for bot ${botId}:`, error);
      if (error instanceof Error && error.message === 'Bot not found') {
        this.setStatus(404);
      } else {
        this.setStatus(500);
      }
      throw error;
    }
  }
  
  /**
   * Add a new knowledge item to a bot
   * 
   * @param botId The unique identifier of the bot
   */
  @Post('/')
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
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Check if bot exists and belongs to the user
      const bot = await BotAdapter.findById(botId);
      
      if (!bot || bot.user !== userId) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Check if bot is in ONLINE status - can't modify running bots
      if (bot.status === BotStatus.ONLINE) {
        this.setStatus(400);
        throw new Error('Cannot modify a running bot. Please stop the bot first.');
      }
      
      // Create the knowledge item
      const knowledgeItem = await KnowledgeAdapter.create({
        botId: botId,
        title: item.title,
        content: item.content,
        type: item.type || 'text',
        priority: item.priority || 0
      });
      
      if (!knowledgeItem) {
        this.setStatus(500);
        throw new Error('Failed to create knowledge item');
      }
      
      return knowledgeItem.toDTO();
    } catch (error) {
      logger.error(`Error adding knowledge item to bot ${botId}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message.includes('Cannot modify')) {
          this.setStatus(400);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error;
    }
  }
  
  /**
   * Update a knowledge item
   * 
   * @param botId The unique identifier of the bot
   * @param itemId The unique identifier of the knowledge item
   */
  @Put('{itemId}')
  @Security('jwt')
  public async updateKnowledgeItem(
    @Path('botId') botId: string,
    @Path() itemId: string,
    @Body() item: {
      title?: string;
      content?: string;
      type?: string;
      priority?: number;
    },
    @Request() request: ExpressRequest
  ): Promise<KnowledgeItemDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Check if bot exists and belongs to the user
      const bot = await BotAdapter.findById(botId);
      
      if (!bot || bot.user !== userId) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Check if bot is in ONLINE status - can't modify running bots
      if (bot.status === BotStatus.ONLINE) {
        this.setStatus(400);
        throw new Error('Cannot modify a running bot. Please stop the bot first.');
      }
      
      // Find the knowledge item by ID
      const knowledgeItem = await KnowledgeAdapter.findById(Number(itemId), botId);
      
      if (!knowledgeItem) {
        this.setStatus(404);
        throw new Error('Knowledge item not found');
      }
      
      // Update the knowledge item
      const updatedItem = await KnowledgeAdapter.update(
        Number(itemId),
        botId,
        {
          title: item.title,
          content: item.content,
          type: item.type,
          priority: item.priority
        }
      );
      
      if (!updatedItem) {
        this.setStatus(500);
        throw new Error('Failed to update knowledge item');
      }
      
      return updatedItem.toDTO();
    } catch (error) {
      logger.error(`Error updating knowledge item ${itemId} for bot ${botId}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found' || error.message === 'Knowledge item not found') {
          this.setStatus(404);
        } else if (error.message.includes('Cannot modify')) {
          this.setStatus(400);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error;
    }
  }
  
  /**
   * Delete a knowledge item
   * 
   * @param botId The unique identifier of the bot
   * @param itemId The unique identifier of the knowledge item
   */
  @Delete('{itemId}')
  @Security('jwt')
  public async deleteKnowledgeItem(
    @Path('botId') botId: string,
    @Path() itemId: string,
    @Request() request: ExpressRequest
  ): Promise<MessageResponseDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Check if bot exists and belongs to the user
      const bot = await BotAdapter.findById(botId);
      
      if (!bot || bot.user !== userId) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Check if bot is in ONLINE status - can't modify running bots
      if (bot.status === BotStatus.ONLINE) {
        this.setStatus(400);
        throw new Error('Cannot modify a running bot. Please stop the bot first.');
      }
      
      // Find the knowledge item by ID
      const knowledgeItem = await KnowledgeAdapter.findById(Number(itemId), botId);
      
      if (!knowledgeItem) {
        this.setStatus(404);
        throw new Error('Knowledge item not found');
      }
      
      // Delete the knowledge item
      const deleted = await KnowledgeAdapter.delete(Number(itemId), botId);
      
      if (!deleted) {
        this.setStatus(500);
        throw new Error('Failed to delete knowledge item');
      }
      
      return {
        message: 'Knowledge item deleted successfully'
      };
    } catch (error) {
      logger.error(`Error deleting knowledge item ${itemId} for bot ${botId}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found' || error.message === 'Knowledge item not found') {
          this.setStatus(404);
        } else if (error.message.includes('Cannot modify')) {
          this.setStatus(400);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error;
    }
  }
}