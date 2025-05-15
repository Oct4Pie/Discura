import { BaseRepository } from "./base.repository";
import { db } from "./database.factory";
import { logger } from "../../utils/logger";

/**
 * Activated channel entity representing a row in the activated_channels table
 */
export interface ActivatedChannelEntity {
  id?: number;
  bot_id: string;
  channel_id: string;
  activated: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * ActivatedChannelRepository - Manages activated channel data operations
 */
export class ActivatedChannelRepository extends BaseRepository<ActivatedChannelEntity> {
  private static instance: ActivatedChannelRepository;

  private constructor() {
    super("activated_channels");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ActivatedChannelRepository {
    if (!ActivatedChannelRepository.instance) {
      ActivatedChannelRepository.instance = new ActivatedChannelRepository();
    }
    return ActivatedChannelRepository.instance;
  }

  /**
   * Find activated channel by bot ID and channel ID
   */
  async findByBotAndChannel(botId: string, channelId: string): Promise<ActivatedChannelEntity | null> {
    try {
      return await db.get<ActivatedChannelEntity>(
        "SELECT * FROM activated_channels WHERE bot_id = ? AND channel_id = ?",
        [botId, channelId]
      );
    } catch (error) {
      logger.error(`Error fetching activated channel for bot ${botId} and channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Find all activated channels for a bot
   */
  async findByBot(botId: string): Promise<ActivatedChannelEntity[]> {
    try {
      return await db.query<ActivatedChannelEntity>(
        "SELECT * FROM activated_channels WHERE bot_id = ? AND activated = 1",
        [botId]
      );
    } catch (error) {
      logger.error(`Error fetching activated channels for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new activated channel entry
   */
  async createActivatedChannel(
    botId: string,
    channelId: string,
    activated: boolean = true
  ): Promise<ActivatedChannelEntity> {
    try {
      const now = new Date().toISOString();
      const activatedChannel: ActivatedChannelEntity = {
        bot_id: botId,
        channel_id: channelId,
        activated: activated ? 1 : 0,
        created_at: now,
        updated_at: now
      };

      const id = await this.create(activatedChannel);
      return {
        ...activatedChannel,
        id: id as number
      };
    } catch (error) {
      logger.error(`Error creating activated channel for bot ${botId} and channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Update activated status for a channel
   */
  async updateActivatedStatus(
    botId: string,
    channelId: string,
    activated: boolean
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const existingChannel = await this.findByBotAndChannel(botId, channelId);

      if (existingChannel) {
        // Update existing record
        return (await db.update(
          this.tableName,
          { activated: activated ? 1 : 0, updated_at: now },
          "bot_id = ? AND channel_id = ?",
          [botId, channelId]
        )) > 0;
      } else {
        // Create new record
        await this.createActivatedChannel(botId, channelId, activated);
        return true;
      }
    } catch (error) {
      logger.error(`Error updating activated status for bot ${botId} and channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all activated channels for a bot
   */
  async deleteAllForBot(botId: string): Promise<boolean> {
    try {
      return (await db.delete(this.tableName, "bot_id = ?", [botId])) > 0;
    } catch (error) {
      logger.error(`Error deleting all activated channels for bot ${botId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const activatedChannelRepository = ActivatedChannelRepository.getInstance();