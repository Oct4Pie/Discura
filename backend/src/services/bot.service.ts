import { LLMProvider, BotStatus } from "@discura/common";
import { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes } from "discord.js";

import { setupMessageHandlers } from "./message.service";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { ActivatedChannelAdapter } from "../models/adapters/activated-channel.adapter";
import { verifyBotConfig } from "../utils/config-validator";
import { logger } from "../utils/logger";

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
 * Register slash commands for a Discord bot
 * @param applicationId Discord application ID
 * @param token Discord bot token
 */
async function registerCommands(applicationId: string, token: string) {
  try {
    logger.info(`Registering slash commands for application ${applicationId}`);
    
    // Define slash commands
    const commands = [
      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if the bot is online"),
      
      new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show available commands and how to use them"),
      
      new SlashCommandBuilder()
        .setName("activate")
        .setDescription("Enable auto-response in the current channel without requiring mentions"),
      
      new SlashCommandBuilder()
        .setName("deactivate")
        .setDescription("Disable auto-response in the current channel"),
      
      new SlashCommandBuilder()
        .setName("image")
        .setDescription("Generate an image from a text prompt")
        .addStringOption(option => 
          option.setName("prompt")
            .setDescription("Describe the image you want to generate")
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName("tool")
        .setDescription("Use a configured tool")
        .addStringOption(option =>
          option.setName("name")
            .setDescription("Select a tool to use")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option.setName("input")
            .setDescription("Input for the tool (optional)")
            .setRequired(false)
        ),
      
      new SlashCommandBuilder()
        .setName("flush")
        .setDescription("Remove older messages from the bot's conversation memory")
        .addIntegerOption(option =>
          option.setName("count")
            .setDescription("Number of messages to remove (default: 10% of history)")
            .setRequired(false)
            .setMinValue(1)
        ),
      
      new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Remove recent messages from the bot's conversation memory")
        .addIntegerOption(option =>
          option.setName("count")
            .setDescription("Number of messages to remove (default: 10% of history)")
            .setRequired(false)
            .setMinValue(1)
        ),
      
      new SlashCommandBuilder()
        .setName("reset")
        .setDescription("Reset (clear) all conversation history for this channel")
    ];

    // Convert SlashCommandBuilder objects to JSON for the API
    const commandsJson = commands.map(command => command.toJSON());

    // Create REST instance for interacting with Discord API
    const rest = new REST().setToken(token);

    // Register the commands with Discord
    logger.info(`Started refreshing ${commandsJson.length} slash commands for application ${applicationId}`);
    
    await rest.put(
      Routes.applicationCommands(applicationId),
      { body: commandsJson }
    );

    logger.info(`Successfully registered ${commandsJson.length} slash commands for application ${applicationId}`);
  } catch (error) {
    logger.error(`Error registering slash commands:`, error);
    throw new Error(`Failed to register slash commands: ${(error as Error).message}`);
  }
}

/**
 * Register slash commands for a Discord bot in a specific guild/server
 * @param applicationId Discord application ID
 * @param token Discord bot token
 * @param guildId Guild/Server ID where commands should be registered
 */
export async function registerCommandsForGuild(applicationId: string, token: string, guildId: string) {
  try {
    logger.info(`Registering slash commands for application ${applicationId} in guild ${guildId}`);
    
    // Define slash commands
    const commands = [
      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if the bot is online"),
      
      new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show available commands and how to use them"),
      
      new SlashCommandBuilder()
        .setName("activate")
        .setDescription("Enable auto-response in the current channel without requiring mentions"),
      
      new SlashCommandBuilder()
        .setName("deactivate")
        .setDescription("Disable auto-response in the current channel"),
      
      new SlashCommandBuilder()
        .setName("image")
        .setDescription("Generate an image from a text prompt")
        .addStringOption(option => 
          option.setName("prompt")
            .setDescription("Describe the image you want to generate")
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName("tool")
        .setDescription("Use a configured tool")
        .addStringOption(option =>
          option.setName("name")
            .setDescription("Select a tool to use")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option.setName("input")
            .setDescription("Input for the tool (optional)")
            .setRequired(false)
        ),
      
      new SlashCommandBuilder()
        .setName("flush")
        .setDescription("Remove older messages from the bot's conversation memory")
        .addIntegerOption(option =>
          option.setName("count")
            .setDescription("Number of messages to remove (default: 10% of history)")
            .setRequired(false)
            .setMinValue(1)
        ),
      
      new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Remove recent messages from the bot's conversation memory")
        .addIntegerOption(option =>
          option.setName("count")
            .setDescription("Number of messages to remove (default: 10% of history)")
            .setRequired(false)
            .setMinValue(1)
        ),
      
      new SlashCommandBuilder()
        .setName("reset")
        .setDescription("Reset (clear) all conversation history for this channel")
    ];

    // Convert SlashCommandBuilder objects to JSON for the API
    const commandsJson = commands.map(command => command.toJSON());

    // Create REST instance for interacting with Discord API
    const rest = new REST().setToken(token);

    // Register the commands with Discord for this specific guild
    logger.info(`Started refreshing ${commandsJson.length} slash commands for application ${applicationId} in guild ${guildId}`);
    
    await rest.put(
      Routes.applicationGuildCommands(applicationId, guildId),
      { body: commandsJson }
    );
    
    logger.info(`Successfully registered ${commandsJson.length} slash commands for application ${applicationId} in guild ${guildId}`);
    return true;
  } catch (error) {
    logger.error(`Error registering slash commands for guild ${guildId}:`, error);
    throw new Error(`Failed to register slash commands: ${(error as Error).message}`);
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

      // Apply appearance settings if configured
      if (bot.configuration?.appearance) {
        try {
          // Apply avatar if provided
          if (bot.configuration.appearance.avatarUrl) {
            logger.info(`Setting avatar for bot ${id} from URL: ${bot.configuration.appearance.avatarUrl}`);
            try {
              await readyClient.user.setAvatar(bot.configuration.appearance.avatarUrl);
              logger.info(`Successfully set avatar for bot ${id}`);
            } catch (avatarError: any) {
              // Discord has rate limits on avatar changes (can only change twice per hour)
              logger.warn(`Failed to set avatar for bot ${id}. This might be due to Discord rate limits: ${avatarError.message}`);
            }
          }

          // Apply presence settings if provided
          if (bot.configuration.appearance.presence) {
            const presence = bot.configuration.appearance.presence;
            
            const presenceData: any = {};
            
            if (presence.status) {
              presenceData.status = presence.status;
            }
            
            if (presence.activity) {
              presenceData.activities = [{
                name: presence.activity.name,
                type: presence.activity.type,
                url: presence.activity.url
              }];
            }
            
            logger.info(`Setting presence for bot ${id}: ${JSON.stringify(presenceData)}`);
            await readyClient.user.setPresence(presenceData);
            logger.info(`Successfully set presence for bot ${id}`);
          }
        } catch (appearanceError) {
          logger.error(`Error applying appearance settings for bot ${id}:`, appearanceError);
          // Continue with bot startup even if appearance settings fail
        }
      }

      // Register slash commands
      try {
        if (bot.applicationId) {
          logger.info(`Registering global slash commands for bot ${id} (${bot.name})`);
          await registerCommands(bot.applicationId, bot.discordToken);
          logger.info(`Successfully registered global slash commands for bot ${id}`);
          
          // Also register commands in each guild for faster updates
          // This ensures commands are immediately available in all servers
          const guilds = readyClient.guilds.cache.map(guild => guild.id);
          logger.info(`Bot ${id} is in ${guilds.length} servers, registering commands for each...`);
          
          for (const guildId of guilds) {
            try {
              await registerCommandsForGuild(bot.applicationId, bot.discordToken, guildId);
              logger.info(`Successfully registered commands for bot ${id} in guild ${guildId}`);
            } catch (guildError) {
              logger.error(`Failed to register commands for bot ${id} in guild ${guildId}:`, guildError);
              // Continue with other guilds even if one fails
            }
          }
        } else {
          logger.warn(`Bot ${id} has no application ID, cannot register slash commands`);
        }
      } catch (commandError) {
        logger.error(`Error registering commands for bot ${id}:`, commandError);
        // Continue with bot startup even if command registration fails
      }

      // Update bot status in database
      await BotAdapter.updateById(id, { status: "ONLINE" });

      // Log successful startup with details
      logger.info(
        `Bot ${id} (${bot.name}) started successfully. Connected to ${readyClient.guilds.cache.size} servers.`,
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
          "Failed to start bot: Invalid Discord token. Please check your token and try again.",
        );
      } else if (errorMessage.includes("disallowed intent")) {
        throw new Error(
          "Failed to start bot: Missing required intents. Make sure Message Content Intent is enabled in the Discord Developer Portal.",
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

    // Check for environment variables for API keys
    const envApiKey = process.env[`${provider.toUpperCase()}_KEY`];

    // For non-CUSTOM providers, check if the API key is in environment variables
    if (provider !== LLMProvider.CUSTOM && !envApiKey) {
      throw new Error(
        `API key for ${provider} provider not found in environment variables. Please set ${provider.toUpperCase()}_KEY in your .env file.`,
      );
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
        "Image provider must be specified when image generation is enabled",
      );
    }

    // Check for environment variables for image provider API keys
    // only if it's different from the LLM provider
    if (provider !== bot.configuration.llmProvider) {
      const envApiKey = process.env[`${provider.toUpperCase()}_KEY`];
      if (!envApiKey) {
        throw new Error(
          `API key for image provider ${provider} not found in environment variables. Please set ${provider.toUpperCase()}_KEY in your .env file.`,
        );
      }
    }

    // Additional image provider validation can be added here
  }

  // Validate system prompt length (if provided)
  if (bot.configuration && bot.configuration.systemPrompt) {
    const maxSystemPromptLength = 4000; // Arbitrary limit to prevent abuse
    if (bot.configuration.systemPrompt.length > maxSystemPromptLength) {
      throw new Error(
        `System prompt exceeds maximum length of ${maxSystemPromptLength} characters`,
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
export async function updateBotConfiguration(id: string, request: any) {
  try {
    // Get current bot data
    const bot = await BotAdapter.findById(id);
    if (!bot) {
      throw new Error("Bot not found");
    }

    // Extract the configuration from the request
    // This handles both UpdateBotConfigurationRequestDto format (with nested configuration property)
    // and direct configuration object format
    const configData = request.configuration || request;

    // Merge new configuration with existing configuration
    const updatedConfig = {
      ...bot.configuration,
      ...configData,
    };

    // Verify configuration is valid
    const validationResult = verifyBotConfig(updatedConfig);
    if (!validationResult.valid) {
      throw new Error(
        `Invalid bot configuration: ${validationResult.errors.join(", ")}`,
      );
    }

    // Update bot with new configuration
    const updated = await BotAdapter.updateById(id, {
      configuration: updatedConfig,
    });

    logger.info(`Updated configuration for bot ${id}`);

    // Check if this bot is currently running
    const runningClient = botClients.get(id);
    if (runningClient) {
      logger.info(`Bot ${id} is currently running - applying configuration changes in real-time`);
      
      // Apply configuration changes to the running bot instance
      // Use a custom property on the client to store the updated configuration
      // This ensures message handlers can access the latest config
      (runningClient as any).botConfig = updatedConfig;
      
      // Emit a custom event that message handlers can listen for
      runningClient.emit('configurationUpdated', updatedConfig);
      
      logger.info(`Real-time configuration update applied to bot ${id}`);
    }

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

    // Delete activated channels for this bot
    try {
      logger.info(`Deleting activated channels for bot ${id}`);
      await ActivatedChannelAdapter.deleteAllForBot(id);
    } catch (channelError) {
      logger.error(`Error deleting activated channels for bot ${id}:`, channelError);
      // Continue with deletion even if this fails
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
          error,
        );

        // Update bot status to ERROR
        try {
          await BotAdapter.updateById(bot.id, { status: BotStatus.ERROR });
        } catch (updateError) {
          logger.error(
            `Failed to update status for bot ${bot.id}:`,
            updateError,
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
      `Bot initialization complete: ${successful} started successfully, ${failed} failed`,
    );

    return results;
  } catch (error) {
    logger.error("Error initializing bots:", error);
    throw error;
  }
}
