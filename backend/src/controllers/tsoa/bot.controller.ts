// src/controllers/tsoa/bot.controller.ts
import { BotStatus } from '@common/types';
import { CONTROLLER_ROUTES, ROUTES } from '@common/types/routes';
import { DISCORD_API } from '@common/constants';
import {
  BotResponseDto,
  BotsResponseDto,
  CreateBotRequest,
  ErrorResponseDto,
  MessageResponseDto,
  UpdateBotRequest
} from '@common/types/api';
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { BotAdapter } from '../../models/adapters/bot.adapter';
import { startBot, stopBot } from '../../services/bot.service';
import { logger } from '../../utils/logger';
import { JwtPayload } from '../../types/express';

/**
 * Bot configuration DTO for local use
 */
interface BotConfigurationDto {
  systemPrompt: string;
  personality: string;
  traits: string[];
  backstory: string;
  llmProvider: string;
  llmModel: string;
  apiKey: string;
  imageGeneration: {
    enabled: boolean;
    provider: string;
    apiKey?: string;
    model?: string;
  };
  toolsEnabled?: boolean;
  tools?: Array<{
    id: string;
    name: string;
    description: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
    }>;
  }>;
  knowledge?: Array<{
    id: string;
    name: string;
    content: string;
    type: string;
    source?: string;
  }>;
}

/**
 * Controller for managing Discord bots
 */
@Route(CONTROLLER_ROUTES.BOTS)
@Tags('Bots')
export class BotController extends Controller {
  /**
   * List all bots for the authenticated user
   * 
   * Returns a list of Discord bots owned by the authenticated user,
   * including their configuration and status.
   */
  @Get('/')
  @Security('jwt')
  public async getUserBots(@Request() request: ExpressRequest): Promise<BotsResponseDto> { 
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Get bots from database using adapter
      const bots = await BotAdapter.findByUserId(userId);
      
      // Map to DTOs
      const botDtos: BotResponseDto[] = bots.map(bot => bot.toDTO());
      
      return { bots: botDtos };
    } catch (error) {
      logger.error('Get user bots error:', error);
      this.setStatus(500);
      throw new Error('Failed to retrieve bots');
    }
  }

  /**
   * Get a specific bot by ID
   * 
   * Returns detailed information about a specific bot owned by the authenticated user.
   * 
   * @param id The unique identifier of the bot
   */
  @Get('{id}')
  @Security('jwt')
  public async getBotById(
    @Path() id: string,
    @Request() request: ExpressRequest
  ): Promise<{ bot: BotResponseDto }> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Get bot from database using adapter
      const bot = await BotAdapter.findById(id);
      
      if (!bot) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Verify ownership
      if (bot.user !== userId) {
        this.setStatus(403);
        throw new Error('Forbidden');
      }
      
      return { bot: bot.toDetailDTO() };
    } catch (error) {
      logger.error('Get bot by ID error:', error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message === 'Unauthorized') {
          this.setStatus(401);
        } else if (error.message === 'Forbidden') {
          this.setStatus(403);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error instanceof Error ? error : new Error('Server error');
    }
  }

  /**
   * Create a new bot
   * 
   * Creates a new Discord bot with the specified configuration.
   * The bot will be owned by the authenticated user.
   */
  @Post('/')
  @Security('jwt')
  @SuccessResponse('201', 'Bot created successfully')
  public async createBot(
    @Body() requestBody: CreateBotRequest,
    @Request() request: ExpressRequest
  ): Promise<BotResponseDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      const { name, discordToken, applicationId } = requestBody;
      
      // Validate required fields
      if (!name || !discordToken || !applicationId) {
        this.setStatus(400);
        throw new Error('Name, Discord token, and application ID are required');
      }
      
      // Create the bot using adapter
      const newBot = await BotAdapter.create({
        userId,
        name,
        applicationId,
        discordToken
      });
      
      // Initialize bot configuration with default values
      const defaultConfig: BotConfigurationDto = {
        systemPrompt: 'You are a helpful Discord bot assistant.',
        personality: 'Friendly and helpful',
        traits: ['helpful', 'friendly', 'knowledgeable'],
        backstory: '',
        llmProvider: 'openai',
        llmModel: 'gpt-3.5-turbo',
        apiKey: '',
        imageGeneration: {
          enabled: false,
          provider: 'openai'
        }
      };
      
      await BotAdapter.updateConfiguration(newBot.id, defaultConfig);
      
      logger.info(`Bot created: ${name} by user ${userId}`);
      this.setStatus(201);
      
      return newBot.toDTO();
    } catch (error) {
      logger.error('Create bot error:', error);
      if (error instanceof Error && error.message.includes('required')) {
        this.setStatus(400);
      } else if (error instanceof Error && error.message === 'Unauthorized') {
        this.setStatus(401);
      } else {
        this.setStatus(500);
      }
      throw error;
    }
  }

  /**
   * Update an existing bot
   * 
   * Updates the configuration of an existing bot owned by the authenticated user.
   * 
   * @param id The unique identifier of the bot to update
   */
  @Put('{id}')
  @Security('jwt')
  public async updateBot(
    @Path() id: string,
    @Body() requestBody: UpdateBotRequest,
    @Request() request: ExpressRequest
  ): Promise<BotResponseDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Get bot from database
      const bot = await BotAdapter.findById(id);
      
      if (!bot) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Verify ownership
      if (bot.user !== userId) {
        this.setStatus(403);
        throw new Error('Forbidden');
      }
      
      // Update basic bot information if provided
      const updates: Record<string, any> = {};
      if (requestBody.name) updates.name = requestBody.name;
      if (requestBody.discordToken) updates.discord_token = requestBody.discordToken;
      
      if (Object.keys(updates).length > 0) {
        await BotAdapter.update(id, updates);
      }
      
      // Update configuration if provided
      if (requestBody.configuration) {
        // Convert the optional configuration fields to the required format for BotConfigurationDto
        const configData: BotConfigurationDto = {
          systemPrompt: requestBody.configuration.systemPrompt || '',
          personality: requestBody.configuration.personality || '',
          traits: requestBody.configuration.traits || [],
          backstory: requestBody.configuration.backstory || '',
          llmProvider: requestBody.configuration.llmProvider || '',
          llmModel: requestBody.configuration.llmModel || '',
          apiKey: requestBody.configuration.apiKey || '',
          imageGeneration: {
            enabled: requestBody.configuration.imageGeneration?.enabled || false,
            provider: requestBody.configuration.imageGeneration?.provider || 'openai',
            apiKey: requestBody.configuration.imageGeneration?.apiKey,
            model: requestBody.configuration.imageGeneration?.model
          },
          toolsEnabled: requestBody.configuration.toolsEnabled || false,
          tools: requestBody.configuration.tools || [],
          // Ensure each knowledge item has a string id
          knowledge: (requestBody.configuration.knowledge || []).map(item => ({
            id: item.id || crypto.randomUUID(),
            name: item.name,
            content: item.content,
            type: item.type,
            source: item.source
          }))
        };
        
        await BotAdapter.updateConfiguration(id, configData);
      }
      
      // Get updated bot
      const updatedBot = await BotAdapter.findById(id);
      
      if (!updatedBot) {
        this.setStatus(500);
        throw new Error('Failed to retrieve updated bot');
      }
      
      logger.info(`Bot updated: ${updatedBot.name}`);
      
      return updatedBot.toDTO();
    } catch (error) {
      logger.error('Update bot error:', error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message === 'Unauthorized') {
          this.setStatus(401);
        } else if (error.message === 'Forbidden') {
          this.setStatus(403);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error instanceof Error ? error : new Error('Server error');
    }
  }

  /**
   * Delete a bot
   * 
   * Deletes a bot owned by the authenticated user.
   * If the bot is currently running, it will be stopped before deletion.
   * 
   * @param id The unique identifier of the bot to delete
   */
  @Delete('{id}')
  @Security('jwt')
  public async deleteBot(
    @Path() id: string,
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
      
      // Get bot from database
      const bot = await BotAdapter.findById(id);
      
      if (!bot) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Verify ownership
      if (bot.user !== userId) {
        this.setStatus(403);
        throw new Error('Forbidden');
      }
      
      const botName = bot.name;

      // If the bot is online, attempt to stop it
      if (bot.status === BotStatus.ONLINE) {
        try {
          await stopBot(id, userId); // Pass userId to stopBot
        } catch (stopError) {
          logger.warn(`Could not stop bot ${botName} during deletion:`, stopError);
        }
      }
      
      // Delete the bot
      await BotAdapter.delete(id);
      
      logger.info(`Bot deleted: ${botName}`);
      return { message: 'Bot deleted successfully' };
    } catch (error) {
      logger.error('Delete bot error:', error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message === 'Unauthorized') {
          this.setStatus(401);
        } else if (error.message === 'Forbidden') {
          this.setStatus(403);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error instanceof Error ? error : new Error('Server error');
    }
  }

  /**
   * Start a bot
   * 
   * Starts a Discord bot that is currently stopped.
   * 
   * @param id The unique identifier of the bot to start
   */
  @Post('{id}/start')
  @Security('jwt')
  public async startBotById(
    @Path() id: string,
    @Request() request: ExpressRequest
  ): Promise<BotResponseDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Get bot from database
      const bot = await BotAdapter.findById(id);
      
      if (!bot) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Verify ownership
      if (bot.user !== userId) {
        this.setStatus(403);
        throw new Error('Forbidden');
      }
      
      if (bot.status === BotStatus.ONLINE) {
        this.setStatus(400);
        throw new Error('Bot is already running');
      }
      
      // Start the bot
      const result = await startBot(id, userId);
      
      if (!result.success) {
        this.setStatus(500);
        throw new Error(result.message || 'Failed to start bot');
      }
      
      // Return the updated bot
      if (result.bot) {
        return result.bot.toDTO();
      }
      
      // Fallback to getting the bot directly if not returned by startBot
      const updatedBot = await BotAdapter.findById(id);
      if (!updatedBot) {
        this.setStatus(500);
        throw new Error('Failed to retrieve updated bot');
      }
      
      return updatedBot.toDTO();
    } catch (error) {
      logger.error('Start bot error:', error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message === 'Unauthorized') {
          this.setStatus(401);
        } else if (error.message === 'Forbidden') {
          this.setStatus(403);
        } else if (error.message === 'Bot is already running') {
          this.setStatus(400);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error instanceof Error ? error : new Error('Server error');
    }
  }

  /**
   * Stop a bot
   * 
   * Stops a Discord bot that is currently running.
   * 
   * @param id The unique identifier of the bot to stop
   */
  @Post('{id}/stop')
  @Security('jwt')
  public async stopBotById(
    @Path() id: string,
    @Request() request: ExpressRequest
  ): Promise<BotResponseDto> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Get bot from database
      const bot = await BotAdapter.findById(id);
      
      if (!bot) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Verify ownership
      if (bot.user !== userId) {
        this.setStatus(403);
        throw new Error('Forbidden');
      }
      
      if (bot.status === BotStatus.OFFLINE) {
        this.setStatus(400);
        throw new Error('Bot is already stopped');
      }
      
      // Stop the bot - make sure to pass userId
      const result = await stopBot(id, userId);
      
      if (!result.success) {
        this.setStatus(500);
        throw new Error(result.message || 'Failed to stop bot');
      }
      
      // Return the updated bot
      if (result.bot) {
        return result.bot.toDTO();
      }
      
      // Fallback to getting the bot directly if not returned by stopBot
      const updatedBot = await BotAdapter.findById(id);
      if (!updatedBot) {
        this.setStatus(500);
        throw new Error('Failed to retrieve updated bot');
      }
      
      return updatedBot.toDTO();
    } catch (error) {
      logger.error('Stop bot error:', error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message === 'Unauthorized') {
          this.setStatus(401);
        } else if (error.message === 'Forbidden') {
          this.setStatus(403);
        } else if (error.message === 'Bot is already stopped') {
          this.setStatus(400);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error instanceof Error ? error : new Error('Server error');
    }
  }

  /**
   * Generate an invite link for a bot
   * 
   * Creates an OAuth2 invite link that users can use to add the bot to their Discord servers.
   * The link includes permissions necessary for the bot to function properly.
   * 
   * @param id The unique identifier of the bot
   */
  @Get('{id}/invite')
  @Security('jwt')
  public async generateInviteLink(
    @Path() id: string,
    @Request() request: ExpressRequest
  ): Promise<{ inviteUrl: string }> {
    try {
      // Get user ID from JWT payload
      const jwtPayload = request.user as JwtPayload;
      const userId = jwtPayload?.id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }
      
      // Get bot from database
      const bot = await BotAdapter.findById(id);
      
      if (!bot) {
        this.setStatus(404);
        throw new Error('Bot not found');
      }
      
      // Verify ownership
      if (bot.user !== userId) {
        this.setStatus(403);
        throw new Error('Forbidden');
      }
      
      // Ensure we have an applicationId 
      if (!bot.applicationId) {
        this.setStatus(400);
        throw new Error('Bot is missing application ID');
      }
      
      // Use Discord's OAuth2 URL format with constants
      const scopes = [DISCORD_API.SCOPES.BOT, DISCORD_API.SCOPES.APPLICATIONS_COMMANDS];
      const scopesString = scopes.join('%20');
      
      // Use permission integer from constants
      const permissionInteger = DISCORD_API.PERMISSION_INTEGERS.BASIC_BOT;
      
      const inviteUrl = `${DISCORD_API.OAUTH2_URL}?client_id=${bot.applicationId}&permissions=${permissionInteger}&scope=${scopesString}`;
      
      logger.info(`Generated invite link for bot: ${bot.name}`);
      
      return { inviteUrl };
    } catch (error) {
      logger.error('Generate invite link error:', error);
      if (error instanceof Error) {
        if (error.message === 'Bot not found') {
          this.setStatus(404);
        } else if (error.message === 'Unauthorized') {
          this.setStatus(401);
        } else if (error.message === 'Forbidden') {
          this.setStatus(403);
        } else if (error.message === 'Bot is missing application ID') {
          this.setStatus(400);
        } else {
          this.setStatus(500);
        }
      } else {
        this.setStatus(500);
      }
      throw error instanceof Error ? error : new Error('Server error');
    }
  }
}
