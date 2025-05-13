import {
  CreateBotRequestDto,
  CreateBotResponseDto,
  GetAllBotsResponseDto,
  GetBotResponseDto,
  StartBotResponseDto,
  StopBotResponseDto,
  UpdateBotRequestDto,
  UpdateBotResponseDto,
  UpdateBotConfigurationRequestDto,
  UpdateBotConfigurationResponseDto,
  GenerateBotInviteLinkResponseDto,
  DeleteBotResponseDto,
  BotStatus,
  TokenValidationResult,
} from "@discura/common";
import { BotController as CommonBotController } from "@discura/common/controllers";
import { Request } from "express";

import {
  createBot,
  getBotsByUser,
  getBotById,
  startBot,
  stopBot,
  updateBot,
  updateBotConfiguration,
  deleteBot,
  generateBotInviteLink,
} from "../services/bot.service";
import { validateBotToken } from "../services/discord.service";
import { logger } from "../utils/logger";

export class BotController extends CommonBotController {
  /**
   * Create a new bot
   * @param requestBody Bot creation data
   * @param request Express request
   * @returns Created bot data with success message
   */
  public async createBot(
    requestBody: CreateBotRequestDto,
    request: Request,
  ): Promise<CreateBotResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Add user ID to bot data
      const botData = {
        ...requestBody,
        userId,
      };

      // Create bot
      const bot = await createBot(botData);

      logger.info(`User ${userId} created bot ${bot.id}`);

      // Return the properly formatted DTO using the toDTO method
      return bot.toDTO();
    } catch (error: any) {
      logger.error("Bot creation failed:", error);
      throw new Error(`Failed to create bot: ${error.message}`);
    }
  }

  /**
   * Get all bots for the current user
   * @param request Express request
   * @returns List of user's bots
   */
  public async getUserBots(request: Request): Promise<GetAllBotsResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get user's bots
      const bots = await getBotsByUser(userId);

      // Map each Bot to BotResponseDto using toDTO() method
      return {
        bots: bots.map((bot) => bot.toDTO()),
      };
    } catch (error: any) {
      logger.error("Get all bots failed:", error);
      throw new Error(`Failed to retrieve bots: ${error.message}`);
    }
  }

  /**
   * Get a specific bot by ID
   * @param id Bot ID
   * @param request Express request
   * @returns Bot data
   */
  public async getBotById(
    id: string,
    request: Request,
  ): Promise<GetBotResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        throw new Error("You do not have permission to view this bot");
      }

      // Return bot with the correct structure using toDTO() method
      return {
        bot: bot.toDTO(),
      };
    } catch (error: any) {
      logger.error(`Get bot ${id} failed:`, error);
      throw new Error(`Failed to retrieve bot: ${error.message}`);
    }
  }

  /**
   * Start a bot
   * @param id Bot ID
   * @param request Express request
   * @returns Updated bot data with status
   */
  public async startBotById(
    id: string,
    request: Request,
  ): Promise<StartBotResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        throw new Error("You do not have permission to start this bot");
      }

      // Check if bot is already online - compare with BotStatus enum
      if (bot.status === BotStatus.ONLINE) {
        logger.info(`Bot ${id} is already online`);
        return bot.toDTO();
      }

      // Start bot
      const updatedBot = await startBot(id);
      logger.info(`Bot ${id} started successfully`);

      // Return the bot with proper DTO conversion
      if (!updatedBot) {
        throw new Error("Failed to start bot: Bot not found after update");
      }
      return updatedBot.toDTO();
    } catch (error: any) {
      logger.error(`Start bot ${id} failed:`, error);

      // Provide helpful error messages
      let errorMessage = `Failed to start bot: ${error.message}`;

      if (error.message.includes("token")) {
        errorMessage =
          "Invalid Discord token. Please check your bot token and try again.";
      } else if (error.message.includes("intent")) {
        errorMessage =
          "Missing required Discord intents. Make sure Message Content Intent is enabled in the Discord Developer Portal.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "Missing LLM provider API key. Please add an API key in your bot's configuration.";
      } else if (error.message.includes("model")) {
        errorMessage =
          "Invalid LLM model. Please select a valid model in your bot's configuration.";
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Stop a bot
   * @param id Bot ID
   * @param request Express request
   * @returns Updated bot data with status
   */
  public async stopBotById(
    id: string,
    request: Request,
  ): Promise<StopBotResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        throw new Error("You do not have permission to stop this bot");
      }

      // Check if bot is already offline - compare with BotStatus enum
      if (bot.status === BotStatus.OFFLINE) {
        logger.info(`Bot ${id} is already offline`);
        return bot.toDTO();
      }

      // Stop bot
      const updatedBot = await stopBot(id);
      logger.info(`Bot ${id} stopped successfully`);

      // Return the bot with proper DTO conversion
      if (!updatedBot) {
        throw new Error("Failed to stop bot: Bot not found after update");
      }
      return updatedBot.toDTO();
    } catch (error: any) {
      logger.error(`Stop bot ${id} failed:`, error);
      throw new Error(`Failed to stop bot: ${error.message}`);
    }
  }

  /**
   * Update a bot's basic information
   * @param id Bot ID
   * @param requestBody Updated bot data
   * @param request Express request
   * @returns Updated bot data
   */
  public async updateBot(
    id: string,
    requestBody: UpdateBotRequestDto,
    request: Request,
  ): Promise<UpdateBotResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        throw new Error("You do not have permission to update this bot");
      }

      // Update bot
      const updatedBot = await updateBot(id, requestBody);
      logger.info(`Bot ${id} updated successfully`);

      // Return the updated bot with proper DTO conversion
      if (!updatedBot) {
        throw new Error("Failed to update bot: Bot not found after update");
      }
      return updatedBot.toDTO();
    } catch (error: any) {
      logger.error(`Update bot ${id} failed:`, error);
      throw new Error(`Failed to update bot: ${error.message}`);
    }
  }

  /**
   * Update a bot's configuration
   * @param id Bot ID
   * @param requestBody Updated configuration data
   * @param request Express request
   * @returns Updated bot data with message
   */
  public async updateBotConfiguration(
    id: string,
    requestBody: UpdateBotConfigurationRequestDto,
    request: Request,
  ): Promise<UpdateBotConfigurationResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        throw new Error(
          "You do not have permission to update this bot's configuration",
        );
      }

      // Update bot configuration
      const updatedBot = await updateBotConfiguration(id, requestBody);

      // Make sure we have a bot returned
      if (!updatedBot) {
        throw new Error(
          "Failed to update bot configuration: Bot not found after update",
        );
      }

      // Determine which aspects were updated for the message
      const updatedAspects = [];
      if (requestBody.configuration?.systemPrompt)
        updatedAspects.push("system prompt");
      if (requestBody.configuration?.personality)
        updatedAspects.push("personality");
      if (requestBody.configuration?.traits) updatedAspects.push("traits");
      if (requestBody.configuration?.backstory)
        updatedAspects.push("backstory");
      if (
        requestBody.configuration?.llmModel ||
        requestBody.configuration?.llmProvider
      )
        updatedAspects.push("LLM settings");

      const aspectsMessage =
        updatedAspects.length > 0
          ? `Updated ${updatedAspects.join(", ")}.`
          : "Configuration updated.";

      const messageText = `Bot configuration saved successfully. ${aspectsMessage}${bot.status === BotStatus.ONLINE ? " Changes will take effect on the next message." : ""}`;

      // Return the updated bot with message as per UpdateBotConfigurationResponseDto
      return {
        ...updatedBot.toDTO(),
        message: messageText,
      };
    } catch (error: any) {
      logger.error(`Update bot ${id} configuration failed:`, error);

      // Provide user-friendly error message
      let errorMessage = `Failed to update bot configuration: ${error.message}`;

      if (error.message.includes("system prompt exceeds maximum")) {
        errorMessage =
          "System prompt is too long. Please shorten it and try again.";
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a bot
   * @param request Express request
   * @param botId Bot ID
   * @returns Success status
   */
  public async deleteBot(
    id: string,
    request: Request,
  ): Promise<DeleteBotResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        return {
          success: false,
          message: "Bot not found",
        };
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        return {
          success: false,
          message: "You do not have permission to delete this bot",
        };
      }

      // Delete bot
      await deleteBot(id);

      // Return success response
      return {
        success: true,
        message: `Bot "${bot.name}" deleted successfully`,
      };
    } catch (error: any) {
      logger.error(`Delete bot ${id} failed:`, error);

      return {
        success: false,
        message: `Failed to delete bot: ${error.message}`,
      };
    }
  }

  /**
   * Generate an invite link for a bot
   * @param id Bot ID
   * @param request Express request
   * @returns Invite URL
   */
  public async generateInviteLink(
    id: string,
    request: Request,
  ): Promise<GenerateBotInviteLinkResponseDto> {
    try {
      // Get user ID from authenticated user
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get bot data
      const bot = await getBotById(id);

      // Check if bot exists
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check if bot belongs to user - use bot.user instead of bot.userId
      if (bot.user !== userId) {
        throw new Error(
          "You do not have permission to generate an invite link for this bot",
        );
      }

      // Generate invite link
      const { inviteUrl } = await generateBotInviteLink(id);

      // Return success response with invite URL
      return {
        inviteUrl,
      };
    } catch (error: any) {
      logger.error(`Generate invite link for bot ${id} failed:`, error);

      let errorMessage = `Failed to generate invite link: ${error.message}`;

      if (error.message.includes("application ID is not available")) {
        errorMessage =
          "Bot application ID is missing. Make sure you've correctly set up your Discord bot.";
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Validate Discord bot token
   * @param requestBody Object containing the token to validate
   * @returns Validation result with token information
   */
  public async validateToken(requestBody: {
    token: string;
  }): Promise<TokenValidationResult> {
    try {
      logger.info("Validating Discord bot token");

      if (!requestBody.token) {
        return {
          valid: false,
          messageContentEnabled: false,
          error: "No token provided",
        };
      }

      // Call the Discord service to validate the token
      const validationResult = await validateBotToken(requestBody.token);

      if (validationResult.valid) {
        logger.info(
          `Token validation successful for bot ${validationResult.botId}`,
        );
      } else {
        logger.warn(`Token validation failed: ${validationResult.error}`);
      }

      return validationResult;
    } catch (error: any) {
      logger.error("Token validation error:", error);
      return {
        valid: false,
        messageContentEnabled: false,
        error: `Token validation failed: ${error.message}`,
      };
    }
  }
}
