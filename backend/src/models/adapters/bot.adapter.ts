import { IMAGE_PROVIDER, DEFAULTS } from "@discura/common/constants";
import {
  BotResponseDto,
  BotStatus,
  ImageProvider,
  LLMProvider,
  Tool,
  BotConfiguration,
} from "@discura/common";
import { v4 as uuidv4 } from "uuid";

import { BotRepository } from "../../services/database/bot.repository";
import { db } from "../../services/database/database.factory";
import { logger } from "../../utils/logger";

/**
 * Bot data from the database
 * This is an internal interface for database entity mapping only
 */
interface BotDbEntity {
  id: string;
  user_id: string;
  name: string;
  application_id: string;
  discord_token: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Bot configuration data from the database
 * This is an internal interface for database entity mapping only
 */
interface BotConfigurationDbEntity {
  bot_id: string;
  system_prompt: string;
  personality: string;
  backstory: string;
  traits: string; // JSON string
  llm_provider: string;
  llm_model: string;
  api_key: string;
  image_generation_enabled: number;
  image_provider: string;
  image_api_key?: string;
  image_model?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Bot model with additional methods
 */
export class Bot {
  id: string;
  user: string;
  name: string;
  applicationId: string;
  discordToken: string;
  status: BotStatus; // Updated to use the directly imported BotStatus
  createdAt: Date;
  updatedAt: Date;
  configuration?: BotConfiguration;

  constructor(data: BotDbEntity, configData?: BotConfigurationDbEntity | null) {
    this.id = data.id;
    this.user = data.user_id;
    this.name = data.name;
    this.applicationId = data.application_id;
    this.discordToken = data.discord_token;
    this.status = data.status as BotStatus; // Cast to directly imported BotStatus
    this.createdAt = new Date(data.created_at);
    this.updatedAt = new Date(data.updated_at);

    if (configData) {
      this.configuration = {
        systemPrompt: configData.system_prompt,
        personality: configData.personality,
        backstory: configData.backstory,
        traits: JSON.parse(configData.traits),
        llmProvider: configData.llm_provider as any, // Using type assertion since database value might not perfectly match enum
        llmModel: configData.llm_model,
        apiKey: configData.api_key,
        imageGeneration: {
          enabled: configData.image_generation_enabled === 1,
          provider: configData.image_provider as ImageProvider,
          apiKey: configData.image_api_key,
          model: configData.image_model,
        },
        toolsEnabled: false,
        tools: [],
        knowledge: [],
      };
    }
  }

  /**
   * Convert to a simplified DTO for list responses
   */
  toDTO(): BotResponseDto {
    // Ensure we have non-null values for required fields
    const safeConfiguration = this.configuration || {
      systemPrompt: DEFAULTS.BOT.SYSTEM_PROMPT,
      personality: DEFAULTS.BOT.PERSONALITY,
      backstory: "",
      traits: DEFAULTS.BOT.TRAITS,
      llmProvider: DEFAULTS.BOT.LLM_PROVIDER,
      llmModel: DEFAULTS.BOT.LLM_MODEL,
      apiKey: "",
      imageGeneration: {
        enabled: false,
        provider: IMAGE_PROVIDER.OPENAI,
      },
      toolsEnabled: false,
      tools: [],
      knowledge: [],
    };

    return {
      id: this.id,
      userId: this.user,
      name: this.name,
      status: this.status as BotStatus,
      applicationId: this.applicationId,
      intents: [], // Add empty intents array
      configuration: {
        systemPrompt: safeConfiguration.systemPrompt,
        personality: safeConfiguration.personality,
        backstory: safeConfiguration.backstory || "",
        traits: safeConfiguration.traits || [],
        llmProvider: safeConfiguration.llmProvider as LLMProvider,
        llmModel: safeConfiguration.llmModel,
        apiKey: safeConfiguration.apiKey || "", // Add the apiKey property
        // Ensure knowledge items have the correct 'type' property by mapping and casting
        knowledge: (safeConfiguration.knowledge || []).map((item) => ({
          ...item,
          type: item.type as "text" | "file", // Cast type to the required literal
        })),
        imageGeneration: {
          enabled: safeConfiguration.imageGeneration?.enabled || false,
          // Convert string to enum using as ImageProvider
          provider: (safeConfiguration.imageGeneration?.provider ||
            IMAGE_PROVIDER.OPENAI) as ImageProvider,
          model: safeConfiguration.imageGeneration?.enabled
            ? safeConfiguration.imageGeneration?.model
            : undefined,
        },
        toolsEnabled: safeConfiguration.toolsEnabled || false,
        tools: (safeConfiguration.tools || []).map((tool) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || [],
          implementation: tool.implementation || "", // Add required implementation property with empty string default
        })),
      },
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Convert to a detailed DTO with full configuration
   */
  toDetailDTO(): BotResponseDto {
    return this.toDTO();
  }
}

/**
 * Adapter for bot model operations
 * Provides an interface between the application and the database
 */
export class BotAdapter {
  /**
   * Find a bot by ID
   */
  static async findById(id: string): Promise<Bot | null> {
    try {
      // Get bot data
      const botData = await db.get<BotDbEntity>(
        "SELECT * FROM bots WHERE id = ?",
        [id]
      );

      if (!botData) {
        return null;
      }

      // Get configuration data
      const configData = await db.get<BotConfigurationDbEntity>(
        "SELECT * FROM bot_configurations WHERE bot_id = ?",
        [id]
      );

      return new Bot(botData, configData);
    } catch (error) {
      logger.error("Error finding bot by ID:", error);
      return null;
    }
  }

  /**
   * Find all bots for a user
   */
  static async findByUserId(userId: string): Promise<Bot[]> {
    try {
      // Get all bots for the user
      const botDataList = await db.query<BotDbEntity>(
        "SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );

      if (botDataList.length === 0) {
        return [];
      }

      // Get all configurations for these bots
      const botIds = botDataList.map((bot) => bot.id);
      const placeholders = botIds.map(() => "?").join(",");

      const configDataList = await db.query<BotConfigurationDbEntity>(
        `SELECT * FROM bot_configurations WHERE bot_id IN (${placeholders})`,
        botIds
      );

      // Map to create bot instances with their configurations
      return botDataList.map((botData) => {
        const configData = configDataList.find(
          (config) => config.bot_id === botData.id
        );
        return new Bot(botData, configData);
      });
    } catch (error) {
      logger.error("Error finding bots by user ID:", error);
      return [];
    }
  }

  /**
   * Find all bots with a specific status
   */
  static async findByStatus(status: BotStatus): Promise<Bot[]> {
    try {
      // Get all bots with the specified status
      const botDataList = await db.query<BotDbEntity>(
        "SELECT * FROM bots WHERE status = ?",
        [status]
      );

      if (botDataList.length === 0) {
        return [];
      }

      // Get all configurations for these bots
      const botIds = botDataList.map((bot) => bot.id);
      const placeholders = botIds.map(() => "?").join(",");

      const configDataList = await db.query<BotConfigurationDbEntity>(
        `SELECT * FROM bot_configurations WHERE bot_id IN (${placeholders})`,
        botIds
      );

      // Map to create bot instances with their configurations
      return botDataList.map((botData) => {
        const configData = configDataList.find(
          (config) => config.bot_id === botData.id
        );
        return new Bot(botData, configData);
      });
    } catch (error) {
      logger.error("Error finding bots by status:", error);
      return [];
    }
  }

  /**
   * Create a new bot
   */
  static async create(data: {
    userId: string;
    name: string;
    applicationId: string;
    discordToken: string;
  }): Promise<Bot> {
    try {
      const now = new Date().toISOString();
      const id = uuidv4();

      // Insert bot data
      await db.insert("bots", {
        id,
        user_id: data.userId,
        name: data.name,
        application_id: data.applicationId,
        discord_token: data.discordToken,
        status: BotStatus.OFFLINE, // Use directly imported BotStatus
        created_at: now,
        updated_at: now,
      });

      const createdBot = await BotAdapter.findById(id);

      if (!createdBot) {
        throw new Error("Failed to create bot");
      }

      return createdBot;
    } catch (error) {
      logger.error("Error creating bot:", error);
      throw error;
    }
  }

  /**
   * Update a bot
   */
  static async update(
    id: string,
    data: Partial<{
      name: string;
      discord_token: string;
      status: BotStatus; // Updated to use directly imported BotStatus
    }>
  ): Promise<boolean> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const result = await db.update("bots", updateData, "id = ?", [id]);
      return result > 0;
    } catch (error) {
      logger.error("Error updating bot:", error);
      return false;
    }
  }

  /**
   * Update or create bot configuration
   */
  static async updateConfiguration(
    botId: string,
    config: BotConfiguration
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      // Check if configuration exists
      const existingConfig = await db.get<BotConfigurationDbEntity>(
        "SELECT * FROM bot_configurations WHERE bot_id = ?",
        [botId]
      );

      const configData = {
        system_prompt: config.systemPrompt,
        personality: config.personality,
        backstory: config.backstory || "",
        traits: JSON.stringify(config.traits || []),
        llm_provider: config.llmProvider,
        llm_model: config.llmModel,
        api_key: config.apiKey || "",
        image_generation_enabled: config.imageGeneration?.enabled ? 1 : 0,
        image_provider: config.imageGeneration?.provider || "",
        image_api_key: config.imageGeneration?.apiKey,
        image_model: config.imageGeneration?.model,
        updated_at: now,
      };

      if (existingConfig) {
        // Update existing configuration
        await db.update("bot_configurations", configData, "bot_id = ?", [
          botId,
        ]);
      } else {
        // Insert new configuration
        await db.insert("bot_configurations", {
          bot_id: botId,
          ...configData,
          created_at: now,
        });
      }

      return true;
    } catch (error) {
      logger.error("Error updating bot configuration:", error);
      return false;
    }
  }

  /**
   * Update bot status
   */
  static async updateStatus(id: string, status: BotStatus): Promise<boolean> {
    // Updated parameter type
    return BotAdapter.update(id, { status });
  }

  /**
   * Delete a bot
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete("bots", "id = ?", [id]);
      return result > 0;
    } catch (error) {
      logger.error("Error deleting bot:", error);
      return false;
    }
  }

  /**
   * Set all bots to offline status
   * Used when the server starts to ensure consistency
   */
  static async setAllBotsOffline(): Promise<void> {
    try {
      await db.run("UPDATE bots SET status = ?, updated_at = ?", [
        BotStatus.OFFLINE,
        new Date().toISOString(),
      ]);
      logger.info("All bots set to offline status");
    } catch (error) {
      logger.error("Error setting all bots to offline:", error);
      throw error;
    }
  }

  /**
   * Update a bot by ID - convenience method for bot.service.ts
   */
  static async updateById(id: string, data: any): Promise<Bot | null> {
    try {
      logger.info(`Updating bot ${id} with data`, data);

      // Process bot base properties
      const botProps: any = {};

      // Extract bot model properties
      if (data.name !== undefined) botProps.name = data.name;
      if (data.discordToken !== undefined)
        botProps.discord_token = data.discordToken;
      if (data.applicationId !== undefined)
        botProps.application_id = data.applicationId;
      if (data.status !== undefined) botProps.status = data.status;

      // Update bot properties if needed
      if (Object.keys(botProps).length > 0) {
        await BotAdapter.update(id, botProps);
      }

      // Update configuration if provided
      if (data.configuration) {
        await BotAdapter.updateConfiguration(id, data.configuration);
      }

      // Return the updated bot
      return await BotAdapter.findById(id);
    } catch (error) {
      logger.error(`Error in updateById for bot ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a bot by ID - alias for delete() for consistency
   */
  static async deleteById(id: string): Promise<boolean> {
    return BotAdapter.delete(id);
  }

  /**
   * Find bots by user - alias for findByUserId() for backward compatibility
   */
  static async findByUser(userId: string): Promise<Bot[]> {
    return BotAdapter.findByUserId(userId);
  }

  /**
   * Find bots by specific criteria
   */
  static async find(criteria: any): Promise<Bot[]> {
    try {
      // Build the SQL query based on criteria
      let sql = "SELECT * FROM bots WHERE 1=1";
      const params: any[] = [];

      // Add conditions based on criteria properties
      if (criteria.status !== undefined) {
        sql += " AND status = ?";
        params.push(criteria.status);
      }

      if (criteria.userId !== undefined) {
        sql += " AND user_id = ?";
        params.push(criteria.userId);
      }

      if (criteria.name !== undefined) {
        sql += " AND name LIKE ?";
        params.push(`%${criteria.name}%`);
      }

      // Get all bots matching the criteria
      const botDataList = await db.query<BotDbEntity>(sql, params);

      if (botDataList.length === 0) {
        return [];
      }

      // Get all configurations for these bots
      const botIds = botDataList.map((bot) => bot.id);
      const placeholders = botIds.map(() => "?").join(",");

      const configDataList = await db.query<BotConfigurationDbEntity>(
        `SELECT * FROM bot_configurations WHERE bot_id IN (${placeholders})`,
        botIds
      );

      // Map to create bot instances with their configurations
      return botDataList.map((botData) => {
        const configData = configDataList.find(
          (config) => config.bot_id === botData.id
        );
        return new Bot(botData, configData);
      });
    } catch (error) {
      logger.error("Error finding bots by criteria:", error);
      return [];
    }
  }
}
