import { Client, GatewayIntentBits, Events } from "discord.js";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { setupMessageHandlers } from "./message.service";
import { logger } from "../utils/logger";
import { LLMProvider } from "@discura/common";
import { verifyBotConfig } from "../utils/config-validator";

// Map to store active bot clients
const botClients = new Map<string, Client>();

/**
 * Get the status of a specific bot
 * @param id Bot ID
 * @returns Bot status or null if not found
 */
export async function getBotStatus(id: string) {
  try {
    const bot = await BotAdapter.findById(id);
    if (!bot) {
      throw new Error("Bot not found");
    }
    return bot.status;
  } catch (error) {
    logger.error(`Error getting bot status for ${id}:`, error);
    throw error;
  }
}

/**
 * Start a bot with the given ID
 * @param id Bot ID
 * @returns Updated bot data
 */
export async function startBot(id: string) {
  logger.info(`Starting bot ${id}`);
  try {
    // Get bot from database
    const bot = await BotAdapter.findById(id);
    if (!bot) {
      throw new Error(`Bot not found: ${id}`);
    }

    // Check if bot is already running
    if (botClients.has(id)) {
      logger.info(`Bot ${id} is already running`);
      return bot;
    }

    // Validate bot configuration
    await validateBotConfiguration(bot);

    // Create new Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    // Set up message handlers
    await setupMessageHandlers(client, id);

    // Handle Discord API errors
    client.on(Events.Error, (error) => {
      logger.error(`Discord error for bot ${id}:`, error);
    });

    // Handle client ready event
    client.once(Events.ClientReady, async (readyClient) => {
      logger.info(`Bot ${id} logged in as ${readyClient.user.tag}`);

      // Update bot status in database
      await BotAdapter.updateById(id, { status: "ONLINE" });

      // Log successful startup with details
      logger.info(
        `Bot ${id} (${bot.name}) started successfully. Connected to ${readyClient.guilds.cache.size} servers.`
      );
    });

    // Log in to Discord with token
    try {
      await client.login(bot.discordToken);
      botClients.set(id, client);
    } catch (loginError: any) {
      logger.error(`Failed to log in bot ${id}:`, loginError);

      // Update bot status to ERROR
      await BotAdapter.updateById(id, { status: "ERROR" });

      // Provide specific error details
      const errorMessage = loginError.message || "Unknown error";

      if (errorMessage.includes("invalid token")) {
        throw new Error(
          "Failed to start bot: Invalid Discord token. Please check your token and try again."
        );
      } else if (errorMessage.includes("disallowed intent")) {
        throw new Error(
          "Failed to start bot: Missing required intents. Make sure Message Content Intent is enabled in the Discord Developer Portal."
        );
      } else {
        throw new Error(`Failed to start bot: ${errorMessage}`);
      }
    }

    // Get updated bot data
    return await BotAdapter.findById(id);
  } catch (error: any) {
    // Handle any other errors
    logger.error(`Error starting bot ${id}:`, error);

    // Set bot status to ERROR if it's a startup issue
    try {
      await BotAdapter.updateById(id, { status: "ERROR" });
    } catch (updateError) {
      logger.error(`Failed to update bot ${id} status to ERROR:`, updateError);
    }

    throw error;
  }
}

/**
 * Stop a bot with the given ID
 * @param id Bot ID
 * @returns Updated bot data
 */
export async function stopBot(id: string) {
  logger.info(`Stopping bot ${id}`);
  try {
    // Get bot client
    const client = botClients.get(id);
    if (!client) {
      logger.info(`Bot ${id} is not running`);
      return await BotAdapter.findById(id);
    }

    try {
      // Attempt graceful shutdown
      logger.info(`Destroying bot ${id} client`);
      await client.destroy();
      logger.info(`Bot ${id} client destroyed successfully`);
    } catch (destroyError) {
      logger.error(`Error destroying bot ${id} client:`, destroyError);
      // Continue with cleanup even if destroy fails
    }

    // Remove bot client from map
    botClients.delete(id);

    // Update bot status in database
    await BotAdapter.updateById(id, { status: "OFFLINE" });
    logger.info(`Bot ${id} stopped successfully`);

    // Get updated bot data
    return await BotAdapter.findById(id);
  } catch (error) {
    logger.error(`Error stopping bot ${id}:`, error);
    throw new Error(`Failed to stop bot: ${(error as Error).message}`);
  }
}

/**
 * Create a new bot with the given data
 * @param botData New bot data
 * @returns Created bot data
 */
export async function createBot(botData: any) {
  try {
    // Set default status to OFFLINE
    const newBot = {
      ...botData,
      status: "OFFLINE",
    };

    // Create new bot in database
    const created = await BotAdapter.create(newBot);
    logger.info(`Created bot ${created.id}`);
    return created;
  } catch (error) {
    logger.error("Error creating bot:", error);
    throw error;
  }
}

/**
 * Validate bot configuration before starting
 * @param bot Bot data
 */
async function validateBotConfiguration(bot: any): Promise<void> {
  // Check required fields
  if (!bot.discordToken) {
    throw new Error("Discord token is required");
  }

  // Validate LLM configuration
  if (bot.configuration && bot.configuration.llmProvider) {
    const provider = bot.configuration.llmProvider as LLMProvider;
    const model = bot.configuration.llmModel;
    const apiKey = bot.configuration.apiKey || process.env.OPENAI_API_KEY;

    // Check if API key is present for the provider (required for non-CUSTOM providers)
    if (provider !== LLMProvider.CUSTOM && !apiKey) {
      throw new Error(`API key is required for ${provider} provider`);
    }

    // Check if model is specified
    if (!model) {
      throw new Error("LLM model must be specified");
    }

    // Additional provider-specific validation can be added here
  }

  // Validate image generation configuration if enabled
  if (bot.configuration && bot.configuration.imageGeneration?.enabled) {
    const provider = bot.configuration.imageGeneration.provider;

    if (!provider) {
      throw new Error(
        "Image provider must be specified when image generation is enabled"
      );
    }

    // Additional image provider validation can be added here
  }

  // Validate system prompt length (if provided)
  if (bot.configuration && bot.configuration.systemPrompt) {
    const maxSystemPromptLength = 4000; // Arbitrary limit to prevent abuse
    if (bot.configuration.systemPrompt.length > maxSystemPromptLength) {
      throw new Error(
        `System prompt exceeds maximum length of ${maxSystemPromptLength} characters`
      );
    }
  }

  logger.info(`Bot ${bot.id} configuration validated successfully`);
}

/**
 * Get all bots for the given user
 * @param userId User ID
 * @returns Array of bots
 */
export async function getBotsByUser(userId: string) {
  try {
    return await BotAdapter.findByUser(userId);
  } catch (error) {
    logger.error("Error getting user's bots:", error);
    throw error;
  }
}

/**
 * Get a bot by ID
 * @param id Bot ID
 * @returns Bot data or null if not found
 */
export async function getBotById(id: string) {
  try {
    return await BotAdapter.findById(id);
  } catch (error) {
    logger.error(`Error getting bot ${id}:`, error);
    throw error;
  }
}

/**
 * Update a bot with the given ID
 * @param id Bot ID
 * @param botData Updated bot data
 * @returns Updated bot data
 */
export async function updateBot(id: string, botData: any) {
  try {
    // Don't allow changing status directly
    if (botData.status) {
      delete botData.status;
    }

    const updated = await BotAdapter.updateById(id, botData);
    logger.info(`Updated bot ${id}`);
    return updated;
  } catch (error) {
    logger.error(`Error updating bot ${id}:`, error);
    throw error;
  }
}

/**
 * Update a bot's configuration
 * @param id Bot ID
 * @param config Configuration data
 * @returns Updated bot data
 */
export async function updateBotConfiguration(id: string, config: any) {
  try {
    // Get current bot data
    const bot = await BotAdapter.findById(id);
    if (!bot) {
      throw new Error("Bot not found");
    }

    // Merge new configuration with existing configuration
    const updatedConfig = {
      ...bot.configuration,
      ...config,
    };

    // Verify configuration is valid
    const validationResult = verifyBotConfig(updatedConfig);
    if (!validationResult.valid) {
      throw new Error(
        `Invalid bot configuration: ${validationResult.errors.join(", ")}`
      );
    }

    // Update bot with new configuration
    const updated = await BotAdapter.updateById(id, {
      configuration: updatedConfig,
    });

    logger.info(`Updated configuration for bot ${id}`);
    return updated;
  } catch (error) {
    logger.error(`Error updating bot ${id} configuration:`, error);
    throw error;
  }
}

/**
 * Delete a bot with the given ID
 * @param id Bot ID
 * @returns Success flag
 */
export async function deleteBot(id: string) {
  logger.info(`Deleting bot ${id}`);
  try {
    // Stop bot if running
    if (botClients.has(id)) {
      await stopBot(id);
    }

    // Delete bot from database
    await BotAdapter.deleteById(id);
    logger.info(`Deleted bot ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting bot ${id}:`, error);
    throw error;
  }
}

/**
 * Generate an invite link for a bot
 * @param id Bot ID
 * @returns Invite URL
 */
export async function generateBotInviteLink(id: string) {
  try {
    // Get bot data
    const bot = await BotAdapter.findById(id);
    if (!bot) {
      throw new Error("Bot not found");
    }

    // Check if application ID is available
    if (!bot.applicationId) {
      throw new Error("Bot application ID is not available");
    }

    // Generate Discord invite URL with required permissions
    const permissions = "274878221376"; // Standard permissions for a chatbot
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${bot.applicationId}&scope=bot%20applications.commands&permissions=${permissions}`;

    logger.info(`Generated invite link for bot ${id}`);
    return { inviteUrl };
  } catch (error) {
    logger.error(`Error generating invite link for bot ${id}:`, error);
    throw error;
  }
}

/**
 * Stop all running bots (used for server shutdown)
 */
export async function stopAllBots() {
  logger.info(`Stopping all bots (${botClients.size} running)`);

  const stopPromises = Array.from(botClients.keys()).map(async (id) => {
    try {
      await stopBot(id);
      return { id, success: true };
    } catch (error) {
      logger.error(`Error stopping bot ${id} during shutdown:`, error);
      return { id, success: false, error };
    }
  });

  const results = await Promise.all(stopPromises);

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info(`Stopped ${successful} bots successfully, ${failed} failed`);
}

/**
 * Initialize all bots that should be running
 * This function is called at server startup to restore bot states
 */
export async function initializeAllBots() {
  try {
    logger.info("Initializing all bots that should be online");

    // Find all bots that were previously online
    const BotStatus = (await import("@discura/common/types")).BotStatus;
    const onlineBots = await BotAdapter.find({ status: BotStatus.ONLINE });

    logger.info(`Found ${onlineBots.length} bots that were previously online`);

    // Start each bot that should be online
    const startPromises = onlineBots.map(async (bot) => {
      try {
        logger.info(`Auto-starting bot ${bot.id} (${bot.name})`);
        await startBot(bot.id);
        return { id: bot.id, name: bot.name, success: true };
      } catch (error) {
        logger.error(
          `Failed to auto-start bot ${bot.id} (${bot.name}):`,
          error
        );

        // Update bot status to ERROR
        try {
          await BotAdapter.updateById(bot.id, { status: BotStatus.ERROR });
        } catch (updateError) {
          logger.error(
            `Failed to update status for bot ${bot.id}:`,
            updateError
          );
        }

        return {
          id: bot.id,
          name: bot.name,
          success: false,
          error: (error as Error).message,
        };
      }
    });

    const results = await Promise.all(startPromises);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(
      `Bot initialization complete: ${successful} started successfully, ${failed} failed`
    );

    return results;
  } catch (error) {
    logger.error("Error initializing bots:", error);
    throw error;
  }
}
