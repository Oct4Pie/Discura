import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { db } from './database.factory';
import { logger } from '../../utils/logger';
import { BotStatus } from '@discura/common/types';

/**
 * Bot entity representing a row in the bots table
 */
export interface BotEntity {
  id: string;
  user_id: string;
  name: string;
  application_id: string;
  discord_token: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Bot configuration entity representing a row in the bot_configurations table
 */
export interface BotConfigEntity {
  bot_id: string;
  system_prompt?: string;
  personality?: string;
  backstory?: string;
  llm_provider?: string;
  llm_model?: string;
  api_key?: string;
  image_generation_enabled?: number;
  image_provider?: string;
  image_api_key?: string;
  image_model?: string;
  configuration_json?: string;
  traits?: string[]; // Add traits property for TypeScript compatibility
  created_at?: string;
  updated_at?: string;
}

/**
 * Bot trait entity representing a row in the bot_traits table
 */
export interface BotTraitEntity {
  id?: number;
  bot_id: string;
  trait: string;
  created_at?: string;
}

/**
 * BotRepository - Manages bot data operations
 */
export class BotRepository extends BaseRepository<BotEntity> {
  private static instance: BotRepository;

  private constructor() {
    super('bots');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BotRepository {
    if (!BotRepository.instance) {
      BotRepository.instance = new BotRepository();
    }
    return BotRepository.instance;
  }

  /**
   * Find bots by user ID
   */
  async findByUserId(userId: string): Promise<BotEntity[]> {
    return this.findByField('user_id', userId);
  }

  /**
   * Find bot by application ID
   */
  async findByApplicationId(applicationId: string): Promise<BotEntity | undefined> {
    const result = await this.findOneByField('application_id', applicationId);
    return result === null ? undefined : result;
  }

  /**
   * Create a new bot
   */
  async createBot(
    userId: string, 
    name: string, 
    applicationId: string, 
    discordToken: string
  ): Promise<BotEntity> {
    try {
      const botId = uuidv4();
      
      const bot: BotEntity = {
        id: botId,
        user_id: userId,
        name,
        application_id: applicationId,
        discord_token: discordToken,
        status: BotStatus.OFFLINE
      };

      await this.create(bot);
      
      // Initialize empty bot configuration
      await db.insert('bot_configurations', {
        bot_id: botId,
        system_prompt: '',
        personality: '',
        backstory: '',
        llm_provider: '',
        llm_model: '',
        image_generation_enabled: 0
      });

      return bot;
    } catch (error) {
      logger.error('Error creating bot:', error);
      throw error;
    }
  }

  /**
   * Get bot with full details including configuration and traits
   */
  async getBotWithDetails(botId: string): Promise<any> {
    try {
      const bot = await this.findById(botId);
      
      if (!bot) {
        return null;
      }

      const config = await db.get<BotConfigEntity>(
        'SELECT * FROM bot_configurations WHERE bot_id = ?',
        [botId]
      );

      const traits = await db.query<BotTraitEntity>(
        'SELECT * FROM bot_traits WHERE bot_id = ?',
        [botId]
      );

      return {
        ...bot,
        configuration: {
          ...(config || {}),
          traits: traits.map(t => t.trait)
        }
      };
    } catch (error) {
      logger.error(`Error fetching bot details for ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Update bot status
   */
  async updateStatus(botId: string, status: BotStatus): Promise<boolean> {
    try {
      const result = await this.update(botId, { 
        status,
        updated_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      logger.error(`Error updating bot status for ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Update bot configuration
   */
  async updateConfiguration(botId: string, config: Partial<BotConfigEntity>): Promise<boolean> {
    try {
      // Check if configuration exists
      const existingConfig = await db.get<BotConfigEntity>(
        'SELECT * FROM bot_configurations WHERE bot_id = ?',
        [botId]
      );

      // Add updated_at timestamp
      const updatedConfig = {
        ...config,
        updated_at: new Date().toISOString()
      };

      if (existingConfig) {
        // Update existing configuration
        await db.update(
          'bot_configurations',
          updatedConfig,
          'bot_id = ?',
          [botId]
        );
      } else {
        // Create new configuration
        await db.insert(
          'bot_configurations',
          {
            bot_id: botId,
            ...updatedConfig
          }
        );
      }

      // Handle traits separately if they exist in the config
      if (config.traits) {
        await this.updateTraits(botId, config.traits);
        delete updatedConfig.traits;
      }

      return true;
    } catch (error) {
      logger.error(`Error updating bot configuration for ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Update bot traits (delete existing and add new ones)
   */
  private async updateTraits(botId: string, traits: string[]): Promise<void> {
    try {
      // Execute in a transaction for atomicity
      await db.executeWrite(async () => {
        // Delete existing traits
        await db.delete('bot_traits', 'bot_id = ?', [botId]);
        
        // Insert new traits
        if (traits && traits.length > 0) {
          for (const trait of traits) {
            await db.insert('bot_traits', {
              bot_id: botId,
              trait
            });
          }
        }
      });
    } catch (error) {
      logger.error(`Error updating bot traits for ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a bot and all related data
   */
  async deleteBot(botId: string): Promise<boolean> {
    try {
      // Execute in a transaction for atomicity
      return await db.executeWrite(async () => {
        // Delete related records first (cascading should handle this, but being explicit)
        await db.delete('bot_traits', 'bot_id = ?', [botId]);
        await db.delete('bot_configurations', 'bot_id = ?', [botId]);
        await db.delete('knowledge_items', 'bot_id = ?', [botId]);
        await db.delete('tool_definitions', 'bot_id = ?', [botId]);
        
        // Delete the bot itself
        const result = await db.delete('bots', 'id = ?', [botId]);
        return result > 0;
      });
    } catch (error) {
      logger.error(`Error deleting bot ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Find bot by application ID
   */
  public async findOneByApplicationId(applicationId: string): Promise<BotEntity | undefined> {
    const result = await this.findOneByField('application_id', applicationId);
    return result === null ? undefined : result;
  }
}

// Export singleton instance
export const botRepository = BotRepository.getInstance();