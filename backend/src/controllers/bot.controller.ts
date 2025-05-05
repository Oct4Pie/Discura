import { BotStatus } from '@common/types'; // Updated import path
import { BotResponseDto, BotsResponseDto, BotDetailResponseDto, UpdateBotRequest } from '@common/types/api'; // Import DTOs
import { NextFunction, Request, Response } from 'express';
import { BotAdapter } from '../models/bot.model';
import { BotConfigurationDto } from '../models/adapters/bot.adapter';
import { UserAdapter } from '../models/user.model';
import { JwtPayload } from '../types/express';
import { logger } from '../utils/logger';
import * as BotService from '../services/bot.service'; // Import BotService

// Create a new bot
export const createBot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, discordToken, applicationId } = req.body;
    const jwtPayload = req.user as JwtPayload;

    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Create the bot using the adapter
    const bot = await BotAdapter.create({
      userId: jwtPayload.id,
      name,
      applicationId,
      discordToken
    });

    if (!bot) {
      return res.status(500).json({ message: 'Failed to create bot' });
    }

    logger.info(`Bot created: ${name} by user ${jwtPayload.id}`);

    // Return the bot DTO
    return res.status(201).json(bot.toDTO());
  } catch (error) {
    logger.error('Create bot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bots for current user
export const getUserBots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bots = await BotAdapter.findByUserId(jwtPayload.id);

    const botsResponse: BotsResponseDto = {
      bots: bots.map(bot => bot.toDTO())
    };

    return res.json(botsResponse);
  } catch (error) {
    logger.error('Get user bots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single bot by ID
export const getBotById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bot = await BotAdapter.findById(req.params.id);

    if (!bot || bot.user !== jwtPayload.id) {
      return res.status(404).json({ message: 'Bot not found or not authorized' });
    }
    
    const botDetailResponse: BotDetailResponseDto = {
      bot: bot.toDetailDTO()
    };

    return res.json(botDetailResponse);
  } catch (error) {
    logger.error('Get bot by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a bot
export const updateBot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const updateData = req.body as UpdateBotRequest;
    
    // Check if bot exists and belongs to user
    const existingBot = await BotAdapter.findById(id);
    if (!existingBot || existingBot.user !== jwtPayload.id) {
      return res.status(404).json({ message: 'Bot not found or not authorized' });
    }

    // Update the bot
    const updated = await BotAdapter.update(id, {
      name: updateData.name,
      discord_token: updateData.discordToken
    });

    if (!updated) {
      return res.status(500).json({ message: 'Failed to update bot' });
    }

    // If configuration was provided, update it
    if (updateData.configuration) {
      // Convert the optional configuration fields to the required format
      const configData: BotConfigurationDto = {
        systemPrompt: updateData.configuration.systemPrompt || '',
        personality: updateData.configuration.personality || '',
        traits: updateData.configuration.traits || [],
        backstory: updateData.configuration.backstory || '',
        llmProvider: updateData.configuration.llmProvider || '',
        llmModel: updateData.configuration.llmModel || '',
        apiKey: updateData.configuration.apiKey || '',
        imageGeneration: {
          enabled: updateData.configuration.imageGeneration?.enabled || false,
          provider: updateData.configuration.imageGeneration?.provider || 'openai',
          apiKey: updateData.configuration.imageGeneration?.apiKey,
          model: updateData.configuration.imageGeneration?.model
        },
        toolsEnabled: updateData.configuration.toolsEnabled || false,
        tools: updateData.configuration.tools || [],
        // Ensure each knowledge item has a string id
        knowledge: (updateData.configuration.knowledge || []).map(item => ({
          id: item.id || crypto.randomUUID(),
          name: item.name,
          content: item.content,
          type: item.type,
          source: item.source
        }))
      };
      
      await BotAdapter.updateConfiguration(id, configData);
    }

    // Get the updated bot
    const bot = await BotAdapter.findById(id);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found after update' });
    }

    return res.json(bot.toDetailDTO());
  } catch (error) {
    logger.error('Update bot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a bot
export const deleteBot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if bot exists and belongs to user
    const existingBot = await BotAdapter.findById(req.params.id);
    if (!existingBot || existingBot.user !== jwtPayload.id) {
      return res.status(404).json({ message: 'Bot not found or not authorized' });
    }

    // Delete the bot
    const deleted = await BotAdapter.delete(req.params.id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete bot' });
    }

    logger.info(`Bot deleted: ${existingBot.name} (ID: ${existingBot.id}) by user ${jwtPayload.id}`);
    return res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    logger.error('Delete bot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start a bot
export const startBotById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await BotService.startBot(req.params.id, jwtPayload.id);
    if (!result.success || !result.bot) {
      return res.status(400).json({ message: result.message });
    }
    
    return res.json(result.bot.toDetailDTO());
  } catch (error) {
    logger.error('Start bot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stop a bot
export const stopBotById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await BotService.stopBot(req.params.id, jwtPayload.id);
    if (!result.success || !result.bot) {
      return res.status(400).json({ message: result.message });
    }
    
    return res.json(result.bot.toDetailDTO());
  } catch (error) {
    logger.error('Stop bot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
