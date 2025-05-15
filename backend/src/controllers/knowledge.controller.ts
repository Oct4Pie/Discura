import {
  KnowledgeItemDto,
  KnowledgeBaseResponseDto,
  MessageResponseDto,
  KnowledgeBase,
} from "@discura/common";
import { KnowledgeController as CommonKnowledgeController } from "@discura/common/controllers";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

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
      const knowledgeItems = bot.configuration?.knowledge || [];

      // Convert to DTOs and ensure required fields exist
      const items: KnowledgeItemDto[] = knowledgeItems.map((item, index) => ({
        id: item.id,
        title: item.name,
        content: item.content,
        type: item.type,
        source: item.source,
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

      // Create a new knowledge item with a unique ID
      const itemId = uuidv4();
      const now = new Date().toISOString();

      const newItem: KnowledgeBase = {
        id: itemId,
        name: item.title,
        content: item.content,
        type: item.type as "text" | "file", // Ensure type is correct
        source: item.type === "file" ? item.content : undefined, // For file types, store URL/path in source
      };

      // Create DTO for response
      const newItemDto: KnowledgeItemDto = {
        id: itemId,
        title: item.title,
        content: item.content,
        type: item.type,
        priority: item.priority || 1,
        createdAt: now,
        updatedAt: now,
      };

      // Update bot configuration with new knowledge item
      const knowledge = [...(bot.configuration?.knowledge || []), newItem];
      
      // Update the bot configuration
      await BotAdapter.updateById(botId, {
        configuration: {
          ...bot.configuration,
          knowledge,
        }
      });

      logger.info(`Created knowledge item for bot ${botId}: ${JSON.stringify(newItem)}`);
      return newItemDto;
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

      // Find the knowledge item to update
      const knowledgeItems = bot.configuration?.knowledge || [];
      const itemIndex = knowledgeItems.findIndex(ki => ki.id === itemId);

      if (itemIndex === -1) {
        throw new Error("Knowledge item not found");
      }

      // Update the item
      const existingItem = knowledgeItems[itemIndex];
      const updatedItem: KnowledgeBase = {
        ...existingItem,
        name: item.title || existingItem.name,
        content: item.content || existingItem.content,
        type: (item.type as "text" | "file") || existingItem.type,
        source: item.type === "file" && item.content ? item.content : existingItem.source,
      };

      // Replace the item in the array
      knowledgeItems[itemIndex] = updatedItem;

      // Update the bot configuration
      await BotAdapter.updateById(botId, {
        configuration: {
          ...bot.configuration,
          knowledge: knowledgeItems,
        }
      });

      // Create DTO for response
      const now = new Date().toISOString();
      const updatedItemDto: KnowledgeItemDto = {
        id: itemId,
        title: updatedItem.name,
        content: updatedItem.content,
        type: updatedItem.type,
        source: updatedItem.source,
        priority: item.priority || itemIndex + 1,
        createdAt: now, // We don't store creation time, so this is an approximation
        updatedAt: now,
      };

      logger.info(`Updated knowledge item ${itemId} for bot ${botId}`);
      return updatedItemDto;
    } catch (error) {
      logger.error(`Error in updateKnowledgeItem for bot ${botId}, item ${itemId}:`, error);
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

      // Find the knowledge items excluding the one to delete
      const knowledgeItems = bot.configuration?.knowledge || [];
      const updatedKnowledgeItems = knowledgeItems.filter(ki => ki.id !== itemId);
      
      if (knowledgeItems.length === updatedKnowledgeItems.length) {
        throw new Error("Knowledge item not found");
      }

      // Update the bot configuration
      await BotAdapter.updateById(botId, {
        configuration: {
          ...bot.configuration,
          knowledge: updatedKnowledgeItems,
        }
      });

      logger.info(`Deleted knowledge item ${itemId} for bot ${botId}`);
      return {
        message: "Knowledge item deleted successfully",
        success: true,
      };
    } catch (error) {
      logger.error(`Error in deleteKnowledgeItem for bot ${botId}, item ${itemId}:`, error);
      throw error;
    }
  }
}
