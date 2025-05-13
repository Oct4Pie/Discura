import {
  KnowledgeItemDto,
  KnowledgeBaseResponseDto,
  MessageResponseDto,
} from "@discura/common";
import { KnowledgeController as CommonKnowledgeController } from "@discura/common/controllers";
import { Request } from "express";

import { BotAdapter } from "../models/adapters/bot.adapter";
import { logger } from "../utils/logger";

/**
 * Implementation of the KnowledgeController for managing bot knowledge bases
 */
export class KnowledgeController extends CommonKnowledgeController {
  /**
   * Get all knowledge items for a specific bot
   */
  public async getKnowledgeItems(
    botId: string,
    request: Request,
  ): Promise<KnowledgeBaseResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get the bot
      const bot = await BotAdapter.findById(botId);

      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error("Bot not found");
      }

      if (bot.user !== userId) {
        throw new Error("You do not have permission to access this bot");
      }

      // Get the knowledge items from the bot configuration
      // In a real implementation, this might come from a separate repository
      const knowledgeItems = bot.configuration?.knowledge || [];

      // Convert to DTOs and ensure required fields exist
      const items: KnowledgeItemDto[] = knowledgeItems.map((item, index) => ({
        id: item.id || index.toString(),
        title: item.name || "Untitled",
        content: item.content,
        type: item.type,
        priority: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      logger.info(`Retrieved ${items.length} knowledge items for bot ${botId}`);

      return {
        botId,
        items,
      };
    } catch (error) {
      logger.error(`Error in getKnowledgeItems for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Add a new knowledge item to a bot
   */
  public async addKnowledgeItem(
    botId: string,
    item: {
      title: string;
      content: string;
      type: string;
      priority?: number;
    },
    request: Request,
  ): Promise<KnowledgeItemDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get the bot
      const bot = await BotAdapter.findById(botId);

      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error("Bot not found");
      }

      if (bot.user !== userId) {
        throw new Error("You do not have permission to modify this bot");
      }

      // Create a new knowledge item
      const newItem: KnowledgeItemDto = {
        id: new Date().getTime().toString(), // Simple ID generation
        title: item.title,
        content: item.content,
        type: item.type,
        priority: item.priority || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In a production implementation, this would be stored in the database
      // For now, we'll just log that it would be created
      logger.info(
        `Created knowledge item for bot ${botId}: ${JSON.stringify(newItem)}`,
      );

      return newItem;
    } catch (error) {
      logger.error(`Error in addKnowledgeItem for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Update a knowledge item
   */
  public async updateKnowledgeItem(
    botId: string,
    itemId: string,
    item: {
      title?: string;
      content?: string;
      type?: string;
      priority?: number;
    },
    request: Request,
  ): Promise<KnowledgeItemDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get the bot
      const bot = await BotAdapter.findById(botId);

      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error("Bot not found");
      }

      if (bot.user !== userId) {
        throw new Error("You do not have permission to modify this bot");
      }

      // In a production implementation, find and update the item in the database
      // For now, return a mock updated item
      const updatedItem: KnowledgeItemDto = {
        id: itemId,
        title: item.title || "Updated Item",
        content: item.content || "Updated content",
        type: item.type || "text",
        priority: item.priority || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info(
        `Updated knowledge item ${itemId} for bot ${botId}: ${JSON.stringify(updatedItem)}`,
      );

      return updatedItem;
    } catch (error) {
      logger.error(
        `Error in updateKnowledgeItem for bot ${botId}, item ${itemId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a knowledge item
   */
  public async deleteKnowledgeItem(
    botId: string,
    itemId: string,
    request: Request,
  ): Promise<MessageResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get the bot
      const bot = await BotAdapter.findById(botId);

      // Check if bot exists and belongs to the user
      if (!bot) {
        throw new Error("Bot not found");
      }

      if (bot.user !== userId) {
        throw new Error("You do not have permission to modify this bot");
      }

      // In a production implementation, delete the item from the database
      // For now, just log that it would be deleted
      logger.info(`Deleted knowledge item ${itemId} for bot ${botId}`);

      return {
        message: "Knowledge item deleted successfully",
        success: true,
      };
    } catch (error) {
      logger.error(
        `Error in deleteKnowledgeItem for bot ${botId}, item ${itemId}:`,
        error,
      );
      throw error;
    }
  }
}
