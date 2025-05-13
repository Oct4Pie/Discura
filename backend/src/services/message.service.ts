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
} from "discord.js";
import { v4 as uuidv4 } from "uuid";

import { generateImage } from "./image.service";
import { callLLM } from "./llm.service";
import {
  evaluateToolResult,
  executeTools,
  findMatchingTools,
  processToolCommand,
} from "./tool.service";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { Bot } from "../models/bot.model";
import { logger } from "../utils/logger";

// Store typing indicators for each channel
const typingIndicators = new Map<string, NodeJS.Timeout>();

// Store conversation history
const conversationHistory = new Map<
  string,
  Array<{ role: string; content: string; userId?: string; username?: string }>
>();
const MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep in history

// Set up message handlers for a Discord bot
export const setupMessageHandlers = async (client: Client, botId: string) => {
  try {
    // Get bot configuration from database
    const bot = await BotAdapter.findById(botId);
    if (!bot) {
      throw new Error(`Bot configuration not found for bot ID: ${botId}`);
    }

    // Set up message event handler
    client.on(Events.MessageCreate, async (message) => {
      await handleMessage(client, message, bot);
    });

    // Set up interaction event handlers
    client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction, bot);
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction, bot);
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmitInteraction(interaction, bot);
      } else if (interaction.isContextMenuCommand()) {
        await handleContextMenuInteraction(interaction, bot);
      } else if (interaction.isAutocomplete()) {
        await handleAutocompleteInteraction(interaction, bot);
      }
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

  return systemPrompt;
}

// Start typing indicator in channel
async function startTypingIndicator(
  channel: TextChannel | DMChannel | ThreadChannel,
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
          err,
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
      error,
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

// Get conversation history for a channel
function getConversationHistory(channelId: string, userId: string) {
  const key = `${channelId}_${userId}`;
  if (!conversationHistory.has(key)) {
    conversationHistory.set(key, []);
  }
  return conversationHistory.get(key) || [];
}

// Add a message to conversation history
function addToConversationHistory(
  channelId: string,
  userId: string,
  role: string,
  content: string,
  username?: string,
) {
  const key = `${channelId}_${userId}`;
  const history = getConversationHistory(channelId, userId);

  history.push({
    role,
    content,
    userId: role === "user" ? userId : undefined,
    username: role === "user" ? username : undefined,
  });

  // Trim history if it exceeds maximum length
  while (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }

  conversationHistory.set(key, history);
}

// Handle incoming Discord messages
export const handleMessage = async (
  client: Client,
  message: Message,
  bot: Bot,
) => {
  // Ignore messages from bots or without content
  if (message.author.bot || !message.content) return;

  // Check if the message mentions the bot or is in a DM
  const mentioned = message.mentions.has(client.user!.id);
  const isDirectMessage = message.channel.type === ChannelType.DM;

  if (!mentioned && !isDirectMessage) return;

  // Extract message content (remove mention if present)
  let content = message.content;
  if (mentioned) {
    content = content.replace(new RegExp(`<@!?${client.user!.id}>`), "").trim();
  }

  // Skip empty messages after removing the mention
  if (!content) return;

  const channel = message.channel;

  // Ensure the channel is text-based before proceeding
  if (!channel.isTextBased()) return;

  try {
    // Start typing indicator to show the bot is "thinking"
    await startTypingIndicator(
      channel as TextChannel | DMChannel | ThreadChannel,
    );

    // Add the user's message to history
    addToConversationHistory(
      channel.id,
      message.author.id,
      "user",
      content,
      message.author.username,
    );

    // Get conversation history
    const history = getConversationHistory(channel.id, message.author.id);

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
          provider: ImageProvider.MIDJOURNEY, // Fixed: Using enum value instead of string literal
        },
        toolsEnabled: false,
        tools: [],
        knowledge: [],
      },
    );

    // Call the LLM with the conversation history and system prompt
    const response = await callLLM({
      botId: bot.id,
      prompt: content,
      systemPrompt: systemPrompt,
      history: history,
      userId: message.author.id,
      username: message.author.username,
      model: bot.configuration?.llmModel,
      provider: bot.configuration?.llmProvider,
    });

    // Add the bot's response to history
    if (response && response.text) {
      addToConversationHistory(
        channel.id,
        message.author.id,
        "assistant",
        response.text,
      );
    }

    // Handle potential image generation
    let sentMessage;
    if (
      response?.generateImage &&
      bot.configuration?.imageGeneration?.enabled
    ) {
      try {
        // Generate an image based on the prompt
        const imageUrl = await generateImage(response.imagePrompt || content, {
          provider: bot.configuration?.imageGeneration?.provider || "openai",
          apiKey: bot.configuration?.apiKey || "",
          model: bot.configuration?.imageGeneration?.model,
          enabled: true,
        });

        // Use type guard to ensure channel is text-based before sending
        if (channel.isTextBased() && "send" in channel) {
          // Send the response with the image
          sentMessage = await channel.send({
            content: response.text,
            files: imageUrl
              ? [{ attachment: imageUrl, name: "generated-image.png" }]
              : [],
          });
        }
      } catch (imageError) {
        logger.error(`Image generation error for bot ${bot.id}:`, imageError);

        // If image generation fails, just send the text response
        if (channel.isTextBased() && "send" in channel) {
          sentMessage = await channel.send({
            content: `${response.text}\n\n*(Failed to generate image: Something went wrong with image generation)*`,
          });
        }
      }
    } else {
      // Send regular text response
      if (channel.isTextBased() && "send" in channel) {
        sentMessage = await channel.send(
          response?.text ||
            "I'm sorry, I'm having trouble processing that request.",
        );
      }
    }

    logger.info(`Bot ${bot.id} responded to message in channel ${channel.id}`);
    return sentMessage;
  } catch (error) {
    logger.error(`Error handling message for bot ${bot.id}:`, error);

    try {
      // Send error message to channel
      if (channel.isTextBased() && "send" in channel) {
        await channel.send(
          "I'm sorry, I encountered an error while processing your request. Please try again later.",
        );
      }
    } catch (sendError) {
      logger.error(
        `Failed to send error message for bot ${bot.id}:`,
        sendError,
      );
    }
  } finally {
    // Always stop the typing indicator
    stopTypingIndicator(channel.id);
  }
};

/**
 * Handles slash command interactions
 * @param interaction Slash command interaction
 * @param bot Bot data from database
 */
async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
  bot: any,
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
          "/image - Generate an image from a prompt",
      });
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
          await interaction.editReply({
            content: `Generated image for: "${prompt}"`,
            files: [{ attachment: imageUrl, name: "generated-image.png" }],
          });
        } else {
          await interaction.editReply(
            "Failed to generate image. Please try again.",
          );
        }
      } catch (error) {
        logger.error(`Error generating image for bot ${bot.id}:`, error);
        await interaction.editReply(
          "Failed to generate image due to an error. Please try again later.",
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
          toolInput || "",
        );
        await interaction.editReply(result || "Tool executed successfully.");
      } catch (error) {
        logger.error(`Error processing tool command for bot ${bot.id}:`, error);
        await interaction.editReply(
          `Error executing tool: ${(error as Error).message}`,
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
          "An error occurred while processing this command.",
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
  bot: any,
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
  bot: any,
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
  bot: any,
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
  bot: any,
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
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );

    // Respond with matching choices (max 25 choices as per Discord's limit)
    await interaction.respond(filtered.slice(0, 25));
  }
}
