import { Request } from 'express';
import { logger } from '../utils/logger';
import { BotAdapter } from '../models/adapters/bot.adapter';
import { 
  BotResponseDto, 
  BotStatus, 
  BotsResponseDto, 
  CreateBotRequest, 
  MessageResponseDto, 
  UpdateBotRequest 
} from '@discura/common/schema/types';
import { 
  startBot,
  stopBot,
  generateBotInviteLink
} from '../services/bot.service';
import { BotController as CommonBotController } from '@discura/common/controllers';
import { Controller } from 'tsoa';

/**
 * Implementation of the BotController for managing Discord bots
 * Extends the common BotController to ensure proper TSOA integration
 */
export class BotController extends CommonBotController {
  /**
   * List all bots for the authenticated user
   */
  public async getUserBots(request: Request): Promise<BotsResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get all bots for the user
      const bots = await BotAdapter.findByUserId(userId);
      
      // Convert to DTOs
      const botDtos = bots.map(bot => bot.toDTO());
      
      logger.info(`Retrieved ${botDtos.length} bots for user ${userId}`);
      return { bots: botDtos };
    } catch (error) {
      logger.error('Error in getUserBots:', error);
      throw error;
    }
  }

  /**
   * Get a specific bot by ID
   */
  public async getBotById(id: string, request: Request): Promise<{ bot: BotResponseDto }> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get the bot
      const bot = await BotAdapter.findById(id);
      
      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      if (bot.user !== userId) {
        throw new Error('You do not have permission to access this bot');
      }
      
      // Convert to detailed DTO
      const botDto = bot.toDetailDTO();
      
      return { bot: botDto };
    } catch (error) {
      logger.error(`Error in getBotById for bot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new bot
   */
  public async createBot(requestBody: CreateBotRequest, request: Request): Promise<BotResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Use the Discord application ID from environment variables if not provided
      const applicationId = requestBody.applicationId || process.env.DISCORD_CLIENT_ID;
      if (!applicationId) {
        throw new Error('Application ID is required and could not be determined from environment variables');
      }

      // Create the new bot
      const bot = await BotAdapter.create({
        userId,
        name: requestBody.name,
        applicationId: applicationId,
        discordToken: requestBody.discordToken
      });
      
      // If configuration was provided, update it
      if (requestBody.configuration) {
        await BotAdapter.updateConfiguration(bot.id, {
          systemPrompt: requestBody.configuration.systemPrompt,
          personality: requestBody.configuration.personality,
          backstory: requestBody.configuration.backstory || '',
          traits: requestBody.configuration.traits || [],
          llmProvider: requestBody.configuration.llmProvider,
          llmModel: requestBody.configuration.llmModel,
          apiKey: requestBody.configuration.apiKey || '',
          imageGeneration: {
            enabled: requestBody.configuration.imageGeneration?.enabled || false,
            provider: requestBody.configuration.imageGeneration?.provider || 'openai',
            apiKey: requestBody.configuration.imageGeneration?.apiKey,
            model: requestBody.configuration.imageGeneration?.model
          },
          toolsEnabled: requestBody.configuration.toolsEnabled || false,
          tools: requestBody.configuration.tools?.map(tool => ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters || [],
            implementation: tool.implementation || '' // Adding required implementation property
          })) || [],
          knowledge: requestBody.configuration.knowledge || [] // Add knowledge property
        });
      }
      
      // Refresh the bot to include the updated configuration
      const updatedBot = await BotAdapter.findById(bot.id);
      if (!updatedBot) {
        throw new Error('Failed to retrieve the created bot');
      }
      
      logger.info(`Bot ${bot.id} created successfully for user ${userId}`);
      return updatedBot.toDTO();
    } catch (error) {
      logger.error('Error in createBot:', error);
      throw error;
    }
  }

  /**
   * Update an existing bot
   */
  public async updateBot(id: string, requestBody: UpdateBotRequest, request: Request): Promise<BotResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get the bot
      const bot = await BotAdapter.findById(id);
      
      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      if (bot.user !== userId) {
        throw new Error('You do not have permission to update this bot');
      }

      // Update basic bot properties if provided
      if (requestBody.name || requestBody.discordToken || requestBody.applicationId || requestBody.status) {
        await BotAdapter.update(id, {
          name: requestBody.name,
          discord_token: requestBody.discordToken,
          status: requestBody.status as BotStatus
        });
      }
      
      // Update configuration if provided
      if (requestBody.configuration) {
        await BotAdapter.updateConfiguration(id, {
          systemPrompt: requestBody.configuration.systemPrompt,
          personality: requestBody.configuration.personality,
          backstory: requestBody.configuration.backstory || '',
          traits: requestBody.configuration.traits || [],
          llmProvider: requestBody.configuration.llmProvider,
          llmModel: requestBody.configuration.llmModel,
          apiKey: requestBody.configuration.apiKey || '',
          imageGeneration: {
            enabled: requestBody.configuration.imageGeneration?.enabled || false,
            provider: requestBody.configuration.imageGeneration?.provider || 'openai',
            apiKey: requestBody.configuration.imageGeneration?.apiKey,
            model: requestBody.configuration.imageGeneration?.model
          },
          toolsEnabled: requestBody.configuration.toolsEnabled || false,
          tools: requestBody.configuration.tools?.map(tool => ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters || [],
            implementation: tool.implementation || '' // Adding required implementation property
          })) || [],
          knowledge: requestBody.configuration.knowledge || [] // Add knowledge property
        });
      }
      
      // Refresh the bot to include the updated configuration
      const updatedBot = await BotAdapter.findById(id);
      if (!updatedBot) {
        throw new Error('Failed to retrieve the updated bot');
      }
      
      logger.info(`Bot ${id} updated successfully by user ${userId}`);
      return updatedBot.toDTO();
    } catch (error) {
      logger.error(`Error in updateBot for bot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a bot
   */
  public async deleteBot(id: string, request: Request): Promise<MessageResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get the bot
      const bot = await BotAdapter.findById(id);
      
      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      if (bot.user !== userId) {
        throw new Error('You do not have permission to delete this bot');
      }

      // Stop the bot if it's running
      if (bot.status === BotStatus.ONLINE) {
        await stopBot(id, userId);
      }
      
      // Delete the bot
      const deleted = await BotAdapter.delete(id);
      
      if (!deleted) {
        throw new Error('Failed to delete the bot');
      }
      
      logger.info(`Bot ${id} deleted successfully by user ${userId}`);
      return { message: 'Bot deleted successfully' };
    } catch (error) {
      logger.error(`Error in deleteBot for bot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Start a bot
   */
  public async startBotById(id: string, request: Request): Promise<BotResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Start the bot
      const result = await startBot(id, userId);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to start bot');
      }
      
      // Get the updated bot
      const bot = await BotAdapter.findById(id);
      if (!bot) {
        throw new Error('Bot not found after starting');
      }
      
      logger.info(`Bot ${id} started successfully by user ${userId}`);
      return bot.toDTO();
    } catch (error) {
      logger.error(`Error in startBotById for bot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Stop a bot
   */
  public async stopBotById(id: string, request: Request): Promise<BotResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Stop the bot
      const result = await stopBot(id, userId);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to stop bot');
      }
      
      // Get the updated bot
      const bot = await BotAdapter.findById(id);
      if (!bot) {
        throw new Error('Bot not found after stopping');
      }
      
      logger.info(`Bot ${id} stopped successfully by user ${userId}`);
      return bot.toDTO();
    } catch (error) {
      logger.error(`Error in stopBotById for bot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generate an invite link for a bot
   */
  public async generateInviteLink(id: string, request: Request): Promise<{ inviteUrl: string }> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get the bot
      const bot = await BotAdapter.findById(id);
      
      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      if (bot.user !== userId) {
        throw new Error('You do not have permission to generate an invite link for this bot');
      }

      // Generate the invite link
      const inviteUrl = await generateBotInviteLink(id);
      
      logger.info(`Generated invite link for bot ${id} by user ${userId}`);
      return { inviteUrl };
    } catch (error) {
      logger.error(`Error in generateInviteLink for bot ${id}:`, error);
      throw error;
    }
  }
}