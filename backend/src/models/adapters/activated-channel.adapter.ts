import { 
  activatedChannelRepository, 
  ActivatedChannelEntity 
} from "../../services/database/activated-channel.repository";
import { logger } from "../../utils/logger";

/**
 * Adapter for activated channel operations
 * Provides an interface between the application and the database
 */
export class ActivatedChannelAdapter {
  /**
   * Check if a channel is activated for a bot
   */
  static async isChannelActivated(botId: string, channelId: string): Promise<boolean> {
    try {
      const channel = await activatedChannelRepository.findByBotAndChannel(botId, channelId);
      return !!channel && channel.activated === 1;
    } catch (error) {
      logger.error(`Error checking if channel ${channelId} is activated for bot ${botId}:`, error);
      return false;
    }
  }

  /**
   * Get all activated channels for a bot
   */
  static async getActivatedChannels(botId: string): Promise<string[]> {
    try {
      const channels = await activatedChannelRepository.findByBot(botId);
      return channels.map(c => c.channel_id);
    } catch (error) {
      logger.error(`Error getting activated channels for bot ${botId}:`, error);
      return [];
    }
  }

  /**
   * Activate a channel for a bot
   */
  static async activateChannel(botId: string, channelId: string): Promise<boolean> {
    try {
      return await activatedChannelRepository.updateActivatedStatus(botId, channelId, true);
    } catch (error) {
      logger.error(`Error activating channel ${channelId} for bot ${botId}:`, error);
      return false;
    }
  }

  /**
   * Deactivate a channel for a bot
   */
  static async deactivateChannel(botId: string, channelId: string): Promise<boolean> {
    try {
      return await activatedChannelRepository.updateActivatedStatus(botId, channelId, false);
    } catch (error) {
      logger.error(`Error deactivating channel ${channelId} for bot ${botId}:`, error);
      return false;
    }
  }

  /**
   * Delete all activated channels for a bot
   */
  static async deleteAllForBot(botId: string): Promise<boolean> {
    try {
      return await activatedChannelRepository.deleteAllForBot(botId);
    } catch (error) {
      logger.error(`Error deleting activated channels for bot ${botId}:`, error);
      return false;
    }
  }
}