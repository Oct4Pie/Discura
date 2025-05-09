import { Client, GatewayIntentBits, Partials, PermissionsBitField, OAuth2Scopes } from 'discord.js';
// Import BotStatus from TSOA models (single source of truth) instead of common/types
import { BotStatus } from '@discura/common/schema/types';
import { DISCORD_API } from '@discura/common/constants';
import { logger } from '../utils/logger';
import { setupMessageHandlers } from './message.service';
import { BotAdapter } from '../models/adapters/bot.adapter';

// Map to store active bot clients
const activeBots = new Map<string, Client>();

/**
 * Retrieves the necessary Discord intents for the bot based on its configuration
 * @param botConfig Bot configuration from database
 * @returns Array of GatewayIntentBits required for the bot
 */
function getRequiredIntents(botConfig: any): GatewayIntentBits[] {
  // Base intents that all bots need
  const baseIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ];
  
  // Add optional intents based on bot configuration
  const optionalIntents = [];
  
  if (botConfig.features?.reactions) {
    optionalIntents.push(
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessageReactions
    );
  }
  
  if (botConfig.features?.memberPresence) {
    optionalIntents.push(GatewayIntentBits.GuildPresences);
  }
  
  if (botConfig.features?.memberTracking) {
    optionalIntents.push(GatewayIntentBits.GuildMembers);
  }
  
  if (botConfig.features?.voiceSupport) {
    optionalIntents.push(
      GatewayIntentBits.GuildVoiceStates, 
      GatewayIntentBits.GuildScheduledEvents
    );
  }

  return [...baseIntents, ...optionalIntents];
}

/**
 * Retrieves the necessary Discord partials for the bot based on its configuration
 * @param botConfig Bot configuration from database
 * @returns Array of Partials required for the bot
 */
function getRequiredPartials(botConfig: any): Partials[] {
  // Base partials that all bots need
  const basePartials = [
    Partials.Message,
    Partials.Channel
  ];
  
  // Add optional partials based on bot configuration
  const optionalPartials = [];
  
  if (botConfig.features?.reactions) {
    optionalPartials.push(
      Partials.Reaction
    );
  }
  
  if (botConfig.features?.memberTracking) {
    optionalPartials.push(
      Partials.GuildMember,
      Partials.User
    );
  }

  return [...basePartials, ...optionalPartials];
}

/**
 * Get required Discord permissions for the bot based on its configuration
 * @param botConfig Bot configuration from database
 * @returns PermissionsBitField with all required permissions
 */
function getRequiredPermissions(botConfig: any): bigint {
  // Base permissions that all bots need
  let permissions = new PermissionsBitField([
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.EmbedLinks
  ]).bitfield;
  
  // Add optional permissions based on bot configuration
  if (botConfig.features?.fileSharing) {
    permissions |= PermissionsBitField.Flags.AttachFiles;
  }
  
  if (botConfig.features?.mentions) {
    permissions |= PermissionsBitField.Flags.MentionEveryone;
  }
  
  if (botConfig.features?.messageManagement) {
    permissions |= PermissionsBitField.Flags.ManageMessages;
  }
  
  if (botConfig.features?.voiceSupport) {
    permissions |= PermissionsBitField.Flags.Connect;
    permissions |= PermissionsBitField.Flags.Speak;
  }
  
  if (botConfig.features?.slashCommands) {
    permissions |= PermissionsBitField.Flags.UseApplicationCommands;
  }
  
  return permissions;
}

/**
 * Generate an OAuth2 URL to invite a bot to a Discord server with appropriate permissions
 * @param botId ID of the bot in our database
 * @returns Invite URL for the bot
 */
export async function generateBotInviteLink(botId: string): Promise<string> {
  try {
    // Get bot configuration from database
    const bot = await BotAdapter.findById(botId);
    if (!bot || !bot.applicationId) {
      throw new Error(`Bot not found or missing client ID: ${botId}`);
    }

    // Determine required permissions based on bot features
    const permissions = getRequiredPermissions(bot);
    
    // Determine required OAuth2 scopes using constants
    const scopes = [
      DISCORD_API.SCOPES.BOT,
      DISCORD_API.SCOPES.APPLICATIONS_COMMANDS
    ];
    const scopesString = scopes.join('%20');

    // Generate the OAuth2 URL using the constant
    const inviteUrl = `${DISCORD_API.OAUTH2_URL}?client_id=${bot.applicationId}&permissions=${permissions}&scope=${scopesString}`;
    
    logger.info(`Generated invite link for bot ${botId}: ${inviteUrl}`);
    return inviteUrl;
  } catch (error) {
    logger.error(`Failed to generate invite link for bot ${botId}:`, error);
    throw error;
  }
}

/**
 * Starts a Discord bot with the given bot ID
 * @param botId ID of the bot to start
 * @param userId User ID of the owner (for permission check)
 * @returns Object containing success status, bot object if successful, and error message if failed
 */
export async function startBot(botId: string, userId: string): Promise<{success: boolean, bot?: any, message?: string}> {
  try {
    // Check if bot is already running
    if (activeBots.has(botId)) {
      logger.info(`Bot ${botId} is already running`);
      return { success: true, message: 'Bot is already running' };
    }

    // Get bot configuration from database and verify ownership
    const bot = await BotAdapter.findById(botId);
    if (!bot) {
      return { success: false, message: 'Bot not found' };
    }
    
    if (bot.user !== userId) {
      return { success: false, message: 'You do not have permission to start this bot' };
    }

    if (!bot.discordToken) {
      return { success: false, message: 'Bot is missing Discord token' };
    }
    
    if (!bot.applicationId) {
      return { success: false, message: 'Bot is missing application ID' }; 
    }

    // Create a new Discord client with appropriate intents and partials
    const client = new Client({
      intents: getRequiredIntents(bot),
      partials: getRequiredPartials(bot)
    });

    // Set up message handlers
    await setupMessageHandlers(client, botId);

    // Log when the bot is ready
    client.once('ready', () => {
      logger.info(`Bot ${botId} is now online as ${client.user?.tag}`);
      
      // Update bot status in database
      BotAdapter.update(botId, { status: BotStatus.ONLINE }).catch(error => {
        logger.error(`Failed to update bot status for ${botId}:`, error);
      });
    });

    // Handle errors
    client.on('error', (error) => {
      logger.error(`Discord client error for bot ${botId}:`, error);
      
      // Update bot status in database
      BotAdapter.update(botId, { status: BotStatus.ERROR }).catch(error => {
        logger.error(`Failed to update bot status for ${botId}:`, error);
      });
    });

    // Update bot status in database to indicate it's being started
    // Use ONLINE status initially, we'll update when ready/error occurs
    await BotAdapter.update(botId, { status: BotStatus.ONLINE });

    // Login to Discord
    await client.login(bot.discordToken);

    // Store the bot client
    activeBots.set(botId, client);
    logger.info(`Bot ${botId} started successfully`);
    
    const updatedBot = await BotAdapter.findById(botId);
    return { success: true, bot: updatedBot };

  } catch (error) {
    logger.error(`Failed to start bot ${botId}:`, error);
    
    // Update bot status in database
    await BotAdapter.update(botId, { status: BotStatus.ERROR }).catch(error => {
      logger.error(`Failed to update bot status for ${botId}:`, error);
    });
    
    return { success: false, message: `Failed to start bot: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Stops a running Discord bot
 * @param botId ID of the bot to stop
 * @param userId User ID of the owner (for permission check)
 * @returns Object containing success status, bot object if successful, and error message if failed
 */
export async function stopBot(botId: string, userId: string): Promise<{success: boolean, bot?: any, message?: string}> {
  try {
    // Get bot and verify ownership
    const bot = await BotAdapter.findById(botId);
    if (!bot) {
      return { success: false, message: 'Bot not found' };
    }
    
    if (bot.user !== userId) {
      return { success: false, message: 'You do not have permission to stop this bot' };
    }
    
    // Check if bot is running
    const client = activeBots.get(botId);
    if (!client) {
      logger.info(`Bot ${botId} is not running`);
      return { success: true, bot, message: 'Bot is already stopped' };
    }

    // Update bot status in database to indicate it's in the process of stopping
    // Use OFFLINE status immediately
    await BotAdapter.update(botId, { status: BotStatus.OFFLINE });

    // Destroy the Discord client
    await client.destroy();

    // Remove from active bots map
    activeBots.delete(botId);
    
    logger.info(`Bot ${botId} stopped successfully`);
    
    const updatedBot = await BotAdapter.findById(botId);
    return { success: true, bot: updatedBot };
    
  } catch (error) {
    logger.error(`Failed to stop bot ${botId}:`, error);
    
    // Update bot status in database
    await BotAdapter.update(botId, { status: BotStatus.ERROR }).catch(error => {
      logger.error(`Failed to update bot status for ${botId}:`, error);
    });
    
    return { success: false, message: `Failed to stop bot: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Stops all running bots
 * Used when shutting down the server
 */
export async function stopAllBots(): Promise<void> {
  try {
    const botIds = Array.from(activeBots.keys());
    logger.info(`Stopping all ${botIds.length} running bots...`);
    
    const stopPromises = botIds.map(botId => stopBot(botId, 'system'));
    await Promise.all(stopPromises);
    
    logger.info('All bots stopped successfully');
  } catch (error) {
    logger.error('Failed to stop all bots:', error);
    throw error;
  }
}

/**
 * Gets the status of a bot (ONLINE, OFFLINE, ERROR, etc.)
 * @param botId ID of the bot to check
 * @returns Status of the bot
 */
export async function getBotStatus(botId: string): Promise<string> {
  try {
    // Check if bot is in memory
    const isRunning = activeBots.has(botId);
    
    // Get bot from database
    const bot = await BotAdapter.findById(botId);
    if (!bot) {
      throw new Error(`Bot not found: ${botId}`);
    }
    
    // If bot is in memory but status is not ONLINE, return the status
    if (isRunning && bot.status !== BotStatus.ONLINE) {
      return bot.status;
    }
    
    // If bot is in memory, it's online
    if (isRunning) {
      return BotStatus.ONLINE;
    }
    
    // If bot is not in memory, return the status from the database
    return bot.status || BotStatus.OFFLINE;
  } catch (error) {
    logger.error(`Failed to get status for bot ${botId}:`, error);
    throw error;
  }
}

/**
 * Restarts a bot
 * @param botId ID of the bot to restart
 */
export async function restartBot(botId: string): Promise<void> {
  try {
    logger.info(`Restarting bot ${botId}...`);
    
    // Stop the bot if it's running
    if (activeBots.has(botId)) {
      await stopBot(botId, 'system');
    }
    
    // Start the bot again
    await startBot(botId, 'system');
    
    logger.info(`Bot ${botId} restarted successfully`);
  } catch (error) {
    logger.error(`Failed to restart bot ${botId}:`, error);
    throw error;
  }
}
