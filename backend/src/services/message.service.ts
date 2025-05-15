import { BotConfiguration, LLMProvider, ImageProvider } from "@discura/common";
import {
  Client,
  Message,
  AutocompleteInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  Events,
  ChannelType,
  TextChannel,
  DMChannel,
  ThreadChannel,
  Collection,
  TextBasedChannel,
  AttachmentBuilder,
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import { generateImage } from "./image.service";
import { callLLM } from "./llm.service";
import {
  evaluateToolResult,
  executeTools,
  findMatchingTools,
  processToolCommand,
} from "./tool.service";
import {
  getConversationHistory,
  addToConversationHistory,
  loadAllBotConversationHistories,
  ConversationMessage,
} from "./conversation-history.service";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { ActivatedChannelAdapter } from "../models/adapters/activated-channel.adapter";
import { Bot } from "../models/bot.model";
import { logger } from "../utils/logger";

// Store typing indicators for each channel
const typingIndicators = new Map<string, NodeJS.Timeout>();

// Store conversation history
const activatedChannels = new Map<string, boolean>(); // Map of channelId -> isActivated

// Maximum number of messages to keep in history
const MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep in history

// Discord's message character limit
const DISCORD_MESSAGE_LIMIT = 2000;

/**
 * Splits a long message into smaller chunks that fit within Discord's character limit
 * @param content The message content to split
 * @param limit Maximum characters per message (default: 2000)
 * @returns An array of message chunks
 */
function splitMessage(
  content: string,
  limit: number = DISCORD_MESSAGE_LIMIT
): string[] {
  if (content.length <= limit) {
    return [content];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  // Split content by lines to try to maintain formatting
  const lines = content.split("\n");

  for (const line of lines) {
    // If line by itself exceeds the limit, we need to split it
    if (line.length > limit) {
      // First, send any accumulated content in the current chunk
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      // Split the long line into appropriate sized chunks
      let remainingLine = line;
      while (remainingLine.length > 0) {
        // Find an appropriate split point, trying to avoid splitting words
        let splitPoint = limit;
        if (remainingLine.length > limit) {
          // Look for a space character to split on
          while (
            splitPoint > 0 &&
            remainingLine[splitPoint] !== " " &&
            remainingLine[splitPoint] !== "\n"
          ) {
            splitPoint--;
          }

          // If we couldn't find a good split point, just split at the limit
          if (splitPoint === 0) {
            splitPoint = limit;
          }
        } else {
          splitPoint = remainingLine.length;
        }

        chunks.push(remainingLine.substring(0, splitPoint));
        remainingLine = remainingLine.substring(splitPoint).trim();
      }
    }
    // If adding this line would exceed the limit, push current chunk and start a new one
    else if (currentChunk.length + line.length + 1 > limit) {
      chunks.push(currentChunk);
      currentChunk = line;
    }
    // Otherwise add the line to the current chunk
    else {
      if (currentChunk) {
        currentChunk += "\n" + line;
      } else {
        currentChunk = line;
      }
    }
  }

  // Push the final chunk if there's any content left
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Sends a message to a Discord channel, automatically splitting it if it exceeds the character limit
 * @param channel The Discord channel to send the message to
 * @param content The content to send
 * @returns The sent message (or the last message if multiple were sent)
 */
async function sendMessageWithSplitting(
  channel: TextBasedChannel,
  content: string
): Promise<Message | null> {
  if (!content) {
    return null;
  }

  try {
    const chunks = splitMessage(content);
    let lastMessage: Message | null = null;

    // Send each chunk as a separate message
    if (channel.isTextBased() && "send" in channel) {
      for (const chunk of chunks) {
        lastMessage = await channel.send(chunk);
      }
    }

    return lastMessage;
  } catch (error) {
    logger.error(`Error sending message to channel ${channel.id}:`, error);
    throw error;
  }
}

// Load activated channels for a bot from the database
async function loadActivatedChannels(botId: string): Promise<void> {
  try {
    logger.info(`[Bot ${botId}] Loading activated channels from database`);
    const channels = await ActivatedChannelAdapter.getActivatedChannels(botId);

    // Clear existing entries for this bot
    for (const [channelId, _] of activatedChannels.entries()) {
      activatedChannels.delete(channelId);
    }

    // Add loaded channels to the map
    for (const channelId of channels) {
      activatedChannels.set(channelId, true);
      logger.debug(`[Bot ${botId}] Loaded activated channel: ${channelId}`);
    }

    logger.info(`[Bot ${botId}] Loaded ${channels.length} activated channels`);
  } catch (error) {
    logger.error(`[Bot ${botId}] Error loading activated channels:`, error);
  }
}

// Set up message handlers for a Discord bot
export const setupMessageHandlers = async (client: Client, botId: string) => {
  try {
    // Get bot configuration from database
    const bot = await BotAdapter.findById(botId);
    if (!bot) {
      throw new Error(`Bot configuration not found for bot ID: ${botId}`);
    }

    // Store bot configuration in the client for real-time updates
    (client as any).botConfig = bot.configuration;

    logger.info(
      `Setting up message handlers for bot ${botId} with username ${client.user?.username || "unknown"}`
    );

    // Load previous conversation histories for this bot
    await loadAllBotConversationHistories(botId);
    logger.info(`Loaded conversation histories for bot ${botId}`);

    // Load activated channels for this bot
    await loadActivatedChannels(botId);

    // Set up message event handler
    client.on(Events.MessageCreate, async (message) => {
      logger.info(
        `[Bot ${botId}] Received message: "${message.content?.substring(0, 50)}${message.content?.length > 50 ? "..." : ""}" from ${message.author.username} (${message.author.id}) in channel ${message.channel.id} (DM: ${message.channel.type === ChannelType.DM})`
      );

      if (message.author.bot) {
        logger.info(
          `[Bot ${botId}] Ignoring message from another bot: ${message.author.username}`
        );
        return;
      }

      const mentioned = message.mentions.has(client.user!.id);
      const isDirectMessage = message.channel.type === ChannelType.DM;

      logger.info(
        `[Bot ${botId}] Message context - mentioned: ${mentioned}, isDirectMessage: ${isDirectMessage}`
      );

      // Get the latest bot config, including any real-time updates
      // Create a proper Bot instance to ensure it has all required methods
      const latestConfig = (client as any).botConfig || bot.configuration;
      const latestBot = Object.create(Object.getPrototypeOf(bot));
      Object.assign(latestBot, bot); // Copy all properties including non-enumerable ones
      latestBot.configuration = latestConfig; // Update with the latest configuration

      await handleMessage(client, message, latestBot);
    });

    // Set up interaction event handlers
    client.on(Events.InteractionCreate, async (interaction) => {
      // Get the latest bot config for this interaction
      // Create a proper Bot instance to ensure it has all required methods
      const latestConfig = (client as any).botConfig || bot.configuration;
      const latestBot = Object.create(Object.getPrototypeOf(bot));
      Object.assign(latestBot, bot); // Copy all properties including non-enumerable ones
      latestBot.configuration = latestConfig; // Update with the latest configuration
      
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction, latestBot);
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction, latestBot);
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmitInteraction(interaction, latestBot);
      } else if (interaction.isContextMenuCommand()) {
        await handleContextMenuInteraction(interaction, latestBot);
      } else if (interaction.isAutocomplete()) {
        await handleAutocompleteInteraction(interaction, latestBot);
      }
    });
    
    // Set up a listener for the custom configuration update event
    client.on('configurationUpdated', (updatedConfig) => {
      logger.info(`[Bot ${botId}] Received real-time configuration update`);
      
      // Store the updated configuration in the client
      (client as any).botConfig = updatedConfig;
      
      logger.info(`[Bot ${botId}] Configuration updated successfully - changes will take effect immediately`);
    });

    logger.info(`Message handlers set up for bot ${botId}`);
  } catch (error) {
    logger.error(`Failed to set up message handlers for bot ${botId}:`, error);
    throw error;
  }
};

// Generate a bot prompt that incorporates personality and backstory
function generateSystemPrompt(botConfig: BotConfiguration): string {
  // Start with the base system prompt or a default helpful assistant prompt
  let systemPrompt =
    botConfig.systemPrompt || "You are a helpful Discord bot assistant.";

  // Add personality if defined
  if (botConfig.personality) {
    systemPrompt += `\n\nYour personality: ${botConfig.personality}`;
  }

  // Add traits if defined
  if (botConfig.traits && botConfig.traits.length > 0) {
    systemPrompt += `\n\nYour traits: ${botConfig.traits.join(", ")}`;
  }

  // Add backstory if defined
  if (botConfig.backstory) {
    systemPrompt += `\n\nYour backstory: ${botConfig.backstory}`;
  }

  // Add basic Discord context
  systemPrompt +=
    "\n\nYou're communicating through Discord, so you can use Discord's formatting (e.g., **bold**, *italic*, etc.).";
  systemPrompt += "\nRespond concisely but helpfully, and be conversational.";
  
  // Add image generation instructions if enabled
  if (botConfig.imageGeneration?.enabled) {
    systemPrompt += "\n\nIMPORTANT: You can generate images by using XML tags in this format:";
    systemPrompt += "\n<generate_image prompt=\"detailed description of the image\"/>";
    systemPrompt += "\nOR";
    systemPrompt += "\n<generate_image><prompt>detailed description of the image</prompt></generate_image>";
    systemPrompt += "\nUse this capability when a user requests an image or when visuals would enhance your response.";
    systemPrompt += "\nMake the image prompt detailed and specific for best results.";
  }

  return systemPrompt;
}

// Start typing indicator in channel
async function startTypingIndicator(
  channel: TextChannel | DMChannel | ThreadChannel
) {
  try {
    // If there's an existing typing indicator for this channel, clear it
    const existingTyping = typingIndicators.get(channel.id);
    if (existingTyping) {
      clearInterval(existingTyping);
    }

    // Start typing
    channel.sendTyping();

    // Keep the typing indicator active with periodic updates
    const typingInterval = setInterval(() => {
      channel.sendTyping().catch((err) => {
        logger.warn(
          `Failed to maintain typing indicator in channel ${channel.id}:`,
          err
        );
        clearInterval(typingInterval);
        typingIndicators.delete(channel.id);
      });
    }, 5000); // Discord typing indicator lasts ~10 seconds, so refresh every 5s

    // Store the interval ID for later cleanup
    typingIndicators.set(channel.id, typingInterval);
  } catch (error) {
    logger.warn(
      `Failed to start typing indicator in channel ${channel.id}:`,
      error
    );
  }
}

// Stop typing indicator in channel
function stopTypingIndicator(channelId: string) {
  const typingInterval = typingIndicators.get(channelId);
  if (typingInterval) {
    clearInterval(typingInterval);
    typingIndicators.delete(channelId);
  }
}

// Handle incoming Discord messages
export const handleMessage = async (
  client: Client,
  message: Message,
  bot: Bot
) => {
  // Check if message has image attachments
  const hasImageAttachments = message.attachments.size > 0 && 
    message.attachments.some(attachment => 
      attachment.contentType?.startsWith('image/'));
  
  // Ignore messages from bots or without content and without image attachments
  if (message.author.bot || (!message.content && !hasImageAttachments)) {
    logger.debug(
      `[Bot ${bot.id}] Ignoring message: ${!message.content ? "empty content" : "from a bot"}${!hasImageAttachments ? "" : " with image attachments"}`
    );
    return;
  }

  // Check if the message mentions the bot, is in a DM, or is in an activated channel
  const mentioned = message.mentions.has(client.user!.id);
  const isDirectMessage = message.channel.type === ChannelType.DM;

  // First check memory cache for performance
  let isActivatedChannel = activatedChannels.get(message.channel.id) === true;

  // If not in memory, double-check with database
  if (!isActivatedChannel) {
    isActivatedChannel = await ActivatedChannelAdapter.isChannelActivated(
      bot.id,
      message.channel.id
    );

    // Update memory cache if found in database
    if (isActivatedChannel) {
      activatedChannels.set(message.channel.id, true);
    }
  }

  if (!mentioned && !isDirectMessage && !isActivatedChannel) {
    logger.debug(
      `[Bot ${bot.id}] Ignoring message: not a mention, DM, or activated channel`
    );
    return;
  }

  // Extract message content (remove mention if present)
  let content = message.content;
  if (mentioned) {
    const mentionRegex = new RegExp(`<@!?${client.user!.id}>`);
    content = content.replace(mentionRegex, "").trim();
    logger.info(
      `[Bot ${bot.id}] Mention detected, extracted content: "${content}"`
    );
  }

  // Process image attachments if present
  if (hasImageAttachments) {
    const imageAttachment = message.attachments.find(attachment => 
      attachment.contentType?.startsWith('image/'));
    
    if (imageAttachment) {
      // If there's no text content, create a default prompt about the image
      if (!content) {
        content = "Can you describe what's in this image?";
        logger.info(
          `[Bot ${bot.id}] Image attachment detected with no text, using default prompt: "${content}"`
        );
      } else {
        content = `${content} [Image attached: ${imageAttachment.url}]`;
        logger.info(
          `[Bot ${bot.id}] Image attachment detected with text, appended to content: "${content}"`
        );
      }
    }
  }

  // Skip empty messages after processing
  if (!content) {
    logger.info(
      `[Bot ${bot.id}] Ignoring message: content is empty after processing`
    );
    return;
  }

  const channel = message.channel;
  logger.info(
    `[Bot ${bot.id}] Processing message in channel type: ${channel.type}`
  );

  // Ensure the channel is text-based before proceeding
  if (!channel.isTextBased()) {
    logger.warn(
      `[Bot ${bot.id}] Channel ${channel} is not text-based, cannot process message`
    );
    return;
  }

  try {
    // Start typing indicator to show the bot is "thinking"
    logger.info(
      `[Bot ${bot.id}] Starting typing indicator in channel ${channel.id}`
    );
    await startTypingIndicator(
      channel as TextChannel | DMChannel | ThreadChannel
    );

    // Always include username when adding to conversation history
    // Use the new addToConversationHistory that only requires channelId and botId (not userId)
    await addToConversationHistory(
      channel.id,
      message.author.id,
      bot.id,
      "user",
      content,
      message.author.username
    );

    // Get conversation history - now only need channelId and botId
    const history = await getConversationHistory(channel.id, bot.id);
    logger.debug(
      `[Bot ${bot.id}] Conversation history length: ${history.length}`
    );

    // Generate system prompt from bot configuration
    const systemPrompt = generateSystemPrompt(
      bot.configuration || {
        systemPrompt: "You are a helpful Discord bot assistant.",
        personality: "",
        traits: [],
        backstory: "",
        llmProvider: LLMProvider.OPENAI,
        llmModel: "gpt-3.5-turbo",
        apiKey: "",
        imageGeneration: {
          enabled: false,
          provider: ImageProvider.MIDJOURNEY,
        },
        toolsEnabled: false,
        tools: [],
        knowledge: [],
        visionModel: "", // Add required visionModel property
        visionProvider: "", // Add required visionProvider property
      }
    );

    logger.info(
      `[Bot ${bot.id}] Calling LLM with model: ${bot.configuration?.llmModel}, provider: ${bot.configuration?.llmProvider}`
    );

    // Enhance the system prompt to tell the bot to pay attention to different usernames in the conversation
    const enhancedSystemPrompt = systemPrompt + "\n\nIMPORTANT: In Discord channels, there are multiple users. Pay attention to usernames to keep track of who is saying what. Address users by their names when appropriate.";

    // Call the LLM with the conversation history and system prompt
    try {
      // Extract image URLs from attachments for vision processing
      const imageURLs: string[] = [];
      if (hasImageAttachments) {
        message.attachments.forEach(attachment => {
          if (attachment.contentType?.startsWith('image/')) {
            imageURLs.push(attachment.url);
            logger.info(`[Bot ${bot.id}] Added image URL to vision processing: ${attachment.url}`);
          }
        });
      }

      const response = await callLLM({
        botId: bot.id,
        prompt: content,
        systemPrompt: enhancedSystemPrompt,
        history: history,
        userId: message.author.id,
        username: message.author.username,
        model: bot.configuration?.llmModel,
        provider: bot.configuration?.llmProvider,
        imageUrls: imageURLs.length > 0 ? imageURLs : undefined,
        visionModel: imageURLs.length > 0 ? bot.configuration?.visionModel : undefined
      });

      logger.info(
        `[Bot ${bot.id}] LLM response received: "${response?.text?.substring(0, 50)}${response?.text?.length > 50 ? "..." : ""}"`
      );

      // Add the bot's response to history, using bot's username for clarity
      if (response && response.text) {
        await addToConversationHistory(
          channel.id,
          message.author.id,
          bot.id,
          "assistant",
          response.text,
          client.user?.username || "Bot"
        );
      } else {
        logger.warn(`[Bot ${bot.id}] LLM returned empty or null response`);
      }

      // Handle LLM response with tool calls if the model supports it and tools are enabled
      if (response?.toolCalls && response.toolCalls.length > 0) {
        // Only process tool calls if the bot has tool calling enabled in its configuration
        if (bot.configuration?.toolsEnabled) {
          logger.info(`[Bot ${bot.id}] Processing ${response.toolCalls.length} tool calls`);
          
          // Find matching tools from the bot's configuration
          const availableTools = bot.configuration.tools || [];
          
          try {
            // Execute each tool call
            const toolResults = await executeTools(response.toolCalls, availableTools);
            
            // Evaluate tool results to create a response
            // Properly map each tool result with its corresponding original call
            const toolResultMessages = toolResults.map((result, index) => {
              const originalCall = response.toolCalls[index];
              return evaluateToolResult(result, originalCall);
            });
            
            // Combine messages or use the first one if only one tool was called
            const toolResultMessage = toolResultMessages.length === 1 
              ? toolResultMessages[0].message 
              : toolResultMessages
                  .map(r => r.message)
                  .filter(Boolean)
                  .join('\n\n');
            
            if (toolResultMessage) {
              // Send the tool result as a follow-up message
              if (channel.isTextBased() && "send" in channel) {
                await sendMessageWithSplitting(channel, toolResultMessage);
              }
              
              // Add the tool result to conversation history
              await addToConversationHistory(
                channel.id,
                message.author.id,
                bot.id,
                "function",
                toolResultMessage,
                "Tools"
              );
            }
          } catch (toolError) {
            logger.error(`[Bot ${bot.id}] Error processing tool calls:`, toolError);
            
            if (channel.isTextBased() && "send" in channel) {
              await sendMessageWithSplitting(channel, 
                "I encountered an error while trying to execute a tool: " + 
                (toolError instanceof Error ? toolError.message : "Unknown error")
              );
            }
          }
        } else {
          // Tool calls were returned by the model, but tools are not enabled in bot configuration
          logger.warn(`[Bot ${bot.id}] Model returned tool calls but tools are disabled in bot configuration`);
          
          if (channel.isTextBased() && "send" in channel) {
            await sendMessageWithSplitting(
              channel,
              response?.text || 
              "I'd like to use tools to help with that, but tool support is currently disabled. Please enable tools in my configuration if you'd like me to use them."
            );
          }
        }
      } else {
        // Regular text response (no tool calls)
        // Handle potential image generation
        let sentMessage;
        if (
          response?.generateImage &&
          bot.configuration?.imageGeneration?.enabled
        ) {
          // ... rest of the image generation code remains unchanged
          try {
            // Generate an image based on the prompt
            logger.info(
              `[Bot ${bot.id}] Generating image with prompt: "${response.imagePrompt || content}"`
            );
            const imageUrl = await generateImage(
              response.imagePrompt || content,
              {
                provider:
                  bot.configuration?.imageGeneration?.provider || "openai",
                apiKey: bot.configuration?.apiKey || "",
                model: bot.configuration?.imageGeneration?.model,
                enabled: true,
              }
            );

            // Use type guard to ensure channel is text-based before sending
            if (channel.isTextBased() && "send" in channel) {
              // Check if we need to split the message
              const responseText = response.text || "";

              // Process the image for Discord attachment
              let attachment;
              if (imageUrl) {
                try {
                  attachment = await processImageForAttachment(imageUrl);
                  logger.info(`[Bot ${bot.id}] Successfully processed image for attachment`);
                } catch (attachmentError) {
                  logger.error(`[Bot ${bot.id}] Error processing image attachment:`, attachmentError);
                }
              }

              if (responseText.length > DISCORD_MESSAGE_LIMIT) {
                // If the response is too long, split it and send the image with the last part
                const chunks = splitMessage(responseText);

                // Send all chunks except the last one
                for (let i = 0; i < chunks.length - 1; i++) {
                  await channel.send(chunks[i]);
                }

                // Send the last chunk with the image
                sentMessage = await channel.send({
                  content: chunks[chunks.length - 1],
                  files: attachment ? [attachment] : [],
                });
              } else {
                // If response is within limit, send as usual
                sentMessage = await channel.send({
                  content: responseText,
                  files: attachment ? [attachment] : [],
                });
              }

              logger.info(
                `[Bot ${bot.id}] Sent response with image to channel ${channel.id}`
              );
            }
          } catch (imageError) {
            logger.error(`[Bot ${bot.id}] Image generation error:`, imageError);

            // If image generation fails, just send the text response
            if (channel.isTextBased() && "send" in channel) {
              sentMessage = await sendMessageWithSplitting(
                channel,
                `${response.text || ""}\n\n*(Failed to generate image: Something went wrong with image generation)*`
              );
            }
          }
        } else {
          // Send regular text response
          if (channel.isTextBased() && "send" in channel) {
            logger.info(
              `[Bot ${bot.id}] Sending text response to channel ${channel.id}`
            );
            sentMessage = await sendMessageWithSplitting(
              channel,
              response?.text ||
                "I'm sorry, I'm having trouble processing that request."
            );
          } else {
            logger.warn(
              `[Bot ${bot.id}] Could not send response - channel is not text-based or doesn't support send()`
            );
          }
        }

        logger.info(
          `[Bot ${bot.id}] Successfully responded to message in channel ${channel.id}`
        );
        return sentMessage;
      }
    } catch (llmError) {
      logger.error(`[Bot ${bot.id}] LLM service error:`, llmError);
      if (channel.isTextBased() && "send" in channel) {
        await sendMessageWithSplitting(
          channel,
          "I'm sorry, I encountered an error while connecting to my AI service. Please try again later."
        );
      }
    }
  } catch (error) {
    logger.error(`[Bot ${bot.id}] Error handling message:`, error);

    try {
      // Send error message to channel
      if (channel.isTextBased() && "send" in channel) {
        await sendMessageWithSplitting(
          channel,
          "I'm sorry, I encountered an error while processing your request. Please try again later."
        );
      }
    } catch (sendError) {
      logger.error(`[Bot ${bot.id}] Failed to send error message:`, sendError);
    }
  } finally {
    // Always stop the typing indicator
    logger.info(
      `[Bot ${bot.id}] Stopping typing indicator for channel ${channel.id}`
    );
    stopTypingIndicator(channel.id);
  }
};

/**
 * Processes an image URL or base64 string for Discord attachment
 * @param imageData URL or base64 string of the image
 * @returns An AttachmentBuilder object ready for Discord
 */
async function processImageForAttachment(imageData: string): Promise<AttachmentBuilder> {
  try {
    // Check if it's a base64 data URL
    if (imageData.startsWith('data:')) {
      logger.debug(`Processing base64 image data`);
      
      // Extract the base64 content
      const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data URL format');
      }
      
      const contentType = matches[1];
      const base64Data = matches[2];
      const extension = contentType.split('/')[1] || 'png';
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create a unique filename for the image
      const filename = `generated-image-${Date.now()}.${extension}`;
      
      // Create an attachment builder with the buffer
      return new AttachmentBuilder(buffer, { name: filename });
    } 
    // If it's a URL or file path
    else {
      // For direct URLs, Discord.js can handle them directly
      // For file paths, we'll use the file path
      return new AttachmentBuilder(imageData, { name: 'generated-image.png' });
    }
  } catch (error) {
    logger.error('Error processing image for attachment:', error);
    throw error;
  }
}

/**
 * Handles slash command interactions
 * @param interaction Slash command interaction
 * @param bot Bot data from database
 */
async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
  bot: any
): Promise<void> {
  // Handle different slash commands here...
  const commandName = interaction.commandName;

  try {
    await interaction.deferReply();

    if (commandName === "ping") {
      await interaction.editReply("Pong!");
    } else if (commandName === "help") {
      await interaction.editReply({
        content:
          "**Available Commands**\n" +
          "/ping - Check if the bot is online\n" +
          "/help - Show this help message\n" +
          "/image - Generate an image from a prompt\n" +
          "/activate - Enable auto-response in the current channel\n" +
          "/deactivate - Disable auto-response in the current channel\n" +
          "/flush [count] - Remove older messages from the conversation history (default: 10%)\n" +
          "/clear [count] - Remove recent messages from the conversation history (default: 10%)\n" +
          "/reset - Clear all conversation history for this channel",
      });
    } else if (commandName === "activate") {
      // Enable auto-response in the current channel
      const channelId = interaction.channelId;

      // Check if channel is already activated (check both memory and database)
      const isActivated =
        activatedChannels.get(channelId) ||
        (await ActivatedChannelAdapter.isChannelActivated(bot.id, channelId));

      if (isActivated) {
        await interaction.editReply({
          content: "✅ This channel is already set for auto-responses!",
        });
        return;
      }

      // Activate the channel in memory and database
      activatedChannels.set(channelId, true);
      await ActivatedChannelAdapter.activateChannel(bot.id, channelId);

      logger.info(
        `[Bot ${bot.id}] Activated auto-response for channel ${channelId}`
      );

      await interaction.editReply({
        content:
          "✅ Auto-response enabled for this channel! I'll now respond to all messages without needing to be mentioned.",
      });
    } else if (commandName === "deactivate") {
      // Disable auto-response in the current channel
      const channelId = interaction.channelId;

      // Check if channel is activated (check both memory and database)
      const isActivated =
        activatedChannels.get(channelId) ||
        (await ActivatedChannelAdapter.isChannelActivated(bot.id, channelId));

      if (!isActivated) {
        await interaction.editReply({
          content: "⚠️ Auto-response is not enabled for this channel.",
        });
        return;
      }

      // Deactivate the channel in memory and database
      activatedChannels.set(channelId, false);
      await ActivatedChannelAdapter.deactivateChannel(bot.id, channelId);

      logger.info(
        `[Bot ${bot.id}] Deactivated auto-response for channel ${channelId}`
      );

      await interaction.editReply({
        content:
          "✅ Auto-response disabled for this channel! You'll need to mention me to get a response.",
      });
    } else if (commandName === "flush") {
      // Flush conversation history for the current channel
      const channelId = interaction.channelId;
      // Get the optional count parameter if provided
      const count = interaction.options.getInteger("count");

      try {
        // Import the flushConversationHistory function
        const { flushConversationHistory } = require("./conversation-history.service");
        
        const flushedCount = await flushConversationHistory(channelId, bot.id, count || undefined);
        
        if (flushedCount > 0) {
          await interaction.editReply({
            content: `🧹 Successfully removed ${flushedCount} older messages from my conversation memory.`,
          });
        } else {
          await interaction.editReply({
            content: "⚠️ No conversation history to flush.",
          });
        }
      } catch (error) {
        logger.error(`[Bot ${bot.id}] Error flushing conversation history:`, error);
        await interaction.editReply({
          content: "❌ Error flushing conversation history. Please try again later.",
        });
      }
    } else if (commandName === "clear") {
      // Clear recent conversation history for the current channel
      const channelId = interaction.channelId;
      // Get the optional count parameter if provided
      const count = interaction.options.getInteger("count");

      try {
        // Import the clearConversationHistory function
        const { clearConversationHistory } = require("./conversation-history.service");
        
        const clearedCount = await clearConversationHistory(channelId, bot.id, count || undefined);
        
        if (clearedCount > 0) {
          await interaction.editReply({
            content: `🧹 Successfully removed ${clearedCount} recent messages from my conversation memory.`,
          });
        } else {
          await interaction.editReply({
            content: "⚠️ No conversation history to clear.",
          });
        }
      } catch (error) {
        logger.error(`[Bot ${bot.id}] Error clearing conversation history:`, error);
        await interaction.editReply({
          content: "❌ Error clearing conversation history. Please try again later.",
        });
      }
    } else if (commandName === "reset") {
      // Reset conversation history for the current channel
      const channelId = interaction.channelId;
      
      try {
        // Import the resetConversationHistory function
        const { resetConversationHistory } = require("./conversation-history.service");
        
        const resetCount = await resetConversationHistory(channelId, bot.id);
        
        if (resetCount > 0) {
          await interaction.editReply({
            content: `🗑️ Successfully removed all ${resetCount} messages from my conversation memory. My memory for this channel is now clean!`,
          });
        } else {
          await interaction.editReply({
            content: "⚠️ No conversation history to reset.",
          });
        }
      } catch (error) {
        logger.error(`[Bot ${bot.id}] Error resetting conversation history:`, error);
        await interaction.editReply({
          content: "❌ Error resetting conversation history. Please try again later.",
        });
      }
    } else if (
      commandName === "image" &&
      bot.configuration?.imageGeneration?.enabled
    ) {
      const prompt = interaction.options.getString("prompt");
      if (!prompt) {
        await interaction.editReply("Please provide a prompt for the image.");
        return;
      }

      try {
        const imageUrl = await generateImage(prompt, {
          provider: bot.configuration?.imageGeneration?.provider || "openai",
          apiKey: bot.configuration?.apiKey || "",
          model: bot.configuration?.imageGeneration?.model,
          enabled: true,
        });

        if (imageUrl) {
          try {
            // Process the image for Discord attachment
            const attachment = await processImageForAttachment(imageUrl);
            
            await interaction.editReply({
              content: `Generated image for: "${prompt}"`,
              files: [attachment],
            });
          } catch (attachmentError) {
            logger.error(`Error processing image attachment: ${attachmentError}`);
            await interaction.editReply(
              "Generated the image but encountered an error while preparing it for sending."
            );
          }
        } else {
          await interaction.editReply(
            "Failed to generate image. Please try again."
          );
        }
      } catch (error) {
        logger.error(`Error generating image for bot ${bot.id}:`, error);
        await interaction.editReply(
          "Failed to generate image due to an error. Please try again later."
        );
      }
    } else if (commandName === "tool" && bot.configuration?.toolsEnabled) {
      const toolName = interaction.options.getString("name");
      const toolInput = interaction.options.getString("input");

      if (!toolName) {
        await interaction.editReply("Please specify a tool to use.");
        return;
      }

      try {
        const result = await processToolCommand(
          bot.id,
          toolName,
          toolInput || ""
        );
        await interaction.editReply(result || "Tool executed successfully.");
      } catch (error) {
        logger.error(`Error processing tool command for bot ${bot.id}:`, error);
        await interaction.editReply(
          `Error executing tool: ${(error as Error).message}`
        );
      }
    } else {
      await interaction.editReply("Unknown command or feature not enabled.");
    }
  } catch (error) {
    logger.error(`Error handling slash command for bot ${bot.id}:`, error);

    try {
      // Try to respond with an error message if we haven't replied yet
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "An error occurred while processing this command."
        );
      } else {
        await interaction.reply({
          content: "An error occurred while processing this command.",
          ephemeral: true,
        });
      }
    } catch (replyError) {
      logger.error(`Failed to send error reply for bot ${bot.id}:`, replyError);
    }
  }
}

/**
 * Handles button interactions
 * @param interaction Button interaction
 * @param bot Bot data from database
 */
async function handleButtonInteraction(
  interaction: ButtonInteraction,
  bot: any
): Promise<void> {
  try {
    await interaction.deferUpdate();
    const buttonId = interaction.customId;

    // Handle button interactions based on customId
    if (buttonId.startsWith("confirm_")) {
      await interaction.editReply({
        content: "Action confirmed!",
        components: [], // Remove buttons
      });
    } else if (buttonId.startsWith("cancel_")) {
      await interaction.editReply({
        content: "Action cancelled.",
        components: [], // Remove buttons
      });
    } else {
      await interaction.editReply({
        content: "Button action not recognized.",
        components: [], // Remove buttons
      });
    }
  } catch (error) {
    logger.error(`Error handling button interaction for bot ${bot.id}:`, error);

    try {
      // Try to respond with an error message
      await interaction.editReply({
        content: "An error occurred while processing this interaction.",
        components: [], // Remove buttons
      });
    } catch (replyError) {
      logger.error(`Failed to send error reply for bot ${bot.id}:`, replyError);
    }
  }
}

/**
 * Handles modal submit interactions
 * @param interaction Modal submit interaction
 * @param bot Bot data from database
 */
async function handleModalSubmitInteraction(
  interaction: ModalSubmitInteraction,
  bot: any
): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    const modalId = interaction.customId;

    // Handle different modal submissions based on customId
    if (modalId === "feedback_form") {
      const feedback = interaction.fields.getTextInputValue("feedback_input");
      logger.info(`Received feedback for bot ${bot.id}: ${feedback}`);

      await interaction.editReply({
        content: "Thank you for your feedback!",
      });
    } else {
      await interaction.editReply({
        content: "Form submission processed.",
      });
    }
  } catch (error) {
    logger.error(`Error handling modal submission for bot ${bot.id}:`, error);

    try {
      // Try to respond with an error message
      await interaction.editReply({
        content: "An error occurred while processing your submission.",
      });
    } catch (replyError) {
      logger.error(`Failed to send error reply for bot ${bot.id}:`, replyError);
    }
  }
}

/**
 * Handles context menu command interactions (message and user context menus)
 * @param interaction Context menu interaction
 * @param bot Bot data from database
 */
async function handleContextMenuInteraction(
  interaction: ContextMenuCommandInteraction,
  bot: any
): Promise<void> {
  // Extract the command name
  const commandName = interaction.commandName;

  // Acknowledge the interaction first
  await interaction.deferReply({ ephemeral: true });

  let response = "";

  // Handle different context menu commands
  if (
    commandName === "Summarize Message" &&
    interaction.isMessageContextMenuCommand()
  ) {
    const targetMessage = interaction.targetMessage;
    const messageContent = targetMessage.content;

    if (!messageContent || messageContent.trim() === "") {
      response = "There's no text content to summarize in this message.";
    } else {
      // Generate system prompt from bot configuration
      const systemPrompt = generateSystemPrompt(bot.configuration || {});

      // Call LLM to summarize the message
      const llmResponse = await callLLM({
        botId: bot.id,
        prompt: `Please summarize the following message concisely: "${messageContent}"`,
        systemPrompt: systemPrompt,
        userId: interaction.user.id,
        username: interaction.user.username,
      });

      response = llmResponse.text || "I couldn't summarize that message.";
    }
  } else if (
    commandName === "User Info" &&
    interaction.isUserContextMenuCommand()
  ) {
    const targetUser = interaction.targetUser;
    response = `User: ${targetUser.username}\nID: ${targetUser.id}\nCreated: ${targetUser.createdAt.toLocaleString()}`;
  } else {
    response = `Unknown context menu command: ${commandName}`;
  }

  // Send the response
  await interaction.followUp({
    content: response,
    ephemeral: true,
  });
}

/**
 * Handles autocomplete interactions for slash commands
 * @param interaction Autocomplete interaction
 * @param bot Bot data from database
 */
async function handleAutocompleteInteraction(
  interaction: AutocompleteInteraction,
  bot: any
): Promise<void> {
  // Get the command name and focused option
  const commandName = interaction.commandName;
  const focusedOption = interaction.options.getFocused(true);

  // Handle autocomplete for different commands
  if (
    commandName === "tool" &&
    focusedOption.name === "name" &&
    bot.configuration?.toolsEnabled
  ) {
    // Get list of available tools for the bot
    const tools = bot.configuration.tools || [];

    // Filter tools based on user input
    const filtered = tools
      .map((tool: { name: string; id: string }) => ({
        name: tool.name,
        value: tool.id,
      }))
      .filter((choice: { name: string; value: string }) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

    // Respond with matching choices (max 25 choices as per Discord's limit)
    await interaction.respond(filtered.slice(0, 25));
  }
}
