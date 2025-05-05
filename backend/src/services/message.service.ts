import { Client, Message, MessageReaction, Interaction, CommandInteraction, ButtonInteraction, ChannelType, TextChannel, User, ModalSubmitInteraction, ContextMenuCommandInteraction, AutocompleteInteraction, PartialMessageReaction, PartialUser, MessageReactionEventDetails } from 'discord.js';
import { logger } from '../utils/logger';
import { generateImage } from './image.service';
import { callLLM } from './llm.service';
import { executeTools } from './tool.service';
import { BotAdapter, Bot } from '../models/adapters/bot.adapter';
import { Tool } from '@common/types'; // Add import for Tool type

// Type for LLM response
interface LLMResponse {
  text: string;
  toolCalls?: any[];
}

/**
 * Sets up event handlers for a Discord bot client
 * @param client Discord.js Client instance
 * @param botId ID of the bot in our database
 */
export async function setupMessageHandlers(client: Client, botId: string): Promise<void> {
  try {
    // Get bot configuration from database
    const bot = await BotAdapter.findById(botId);
    if (!bot) {
      throw new Error(`Bot not found with ID: ${botId}`);
    }

    // Set up event handlers
    client.on('messageCreate', async (message: Message) => {
      try {
        // Don't respond to messages from other bots including itself
        if (message.author.bot) return;
        
        // Only respond to messages that mention the bot or are in DMs
        const isMentioned = message.mentions.users.has(client.user!.id);
        const isDM = message.channel.isDMBased();
        
        if (!isMentioned && !isDM) return;
        
        await handleMessage(client, message, bot);
      } catch (error) {
        logger.error(`Error handling message for bot ${botId}:`, error);
      }
    });

    client.on('messageReactionAdd', async (reaction, user, details) => {
      try {
        // Don't respond to reactions from other bots including itself
        if (user.bot) return;
        
        await handleReaction(reaction, user, bot);
      } catch (error) {
        logger.error(`Error handling reaction for bot ${botId}:`, error);
      }
    });

    client.on('interactionCreate', async (interaction: Interaction) => {
      try {
        // Handle different types of interactions
        if (interaction.isChatInputCommand()) {
          await handleCommandInteraction(interaction, bot);
        } 
        else if (interaction.isButton()) {
          await handleButtonInteraction(interaction, bot);
        }
        else if (interaction.isModalSubmit()) {
          await handleModalInteraction(interaction as ModalSubmitInteraction, bot);
        }
        else if (interaction.isContextMenuCommand()) {
          await handleContextMenuInteraction(interaction as ContextMenuCommandInteraction, bot);
        }
        else if (interaction.isAutocomplete()) {
          await handleAutocompleteInteraction(interaction as AutocompleteInteraction, bot);
        }
      } catch (error) {
        logger.error(`Error handling interaction for bot ${botId}:`, error);
        
        // Respond to the interaction if it hasn't been acknowledged yet
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: 'Sorry, there was an error processing your request.', 
            ephemeral: true 
          }).catch(err => {
            logger.error('Failed to send error reply:', err);
          });
        }
      }
    });

    logger.info(`Set up message handlers for bot ${botId}`);
  } catch (error) {
    logger.error(`Failed to set up message handlers for bot ${botId}:`, error);
    throw error;
  }
}

// Handle reaction events
async function handleReaction(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, bot: Bot): Promise<void> {
  try {
    // Partial reactions need to be fetched
    const fullReaction = reaction.partial ? await reaction.fetch() : reaction;
    
    // Implementation for handling reactions
    logger.info(`Reaction received: ${fullReaction.emoji.name} from user ${user.tag || user.username}`);
  } catch (error) {
    logger.error('Error handling reaction:', error);
  }
}

/**
 * Handles slash command interactions
 */
async function handleCommandInteraction(interaction: CommandInteraction, bot: any): Promise<void> {
  // Get the command name
  const commandName = interaction.commandName;
  
  logger.info(`Bot ${bot.name} received command: ${commandName}`);
  
  if (commandName === 'help') {
    await interaction.reply({
      content: 'I am a Discord bot powered by Discura. You can chat with me or use slash commands!',
      ephemeral: true
    });
  } else if (commandName === 'info') {
    await interaction.reply({
      content: `Bot Name: ${bot.name}\nPersonality: ${bot.configuration?.personality || 'Friendly'}`,
      ephemeral: false
    });
  } else {
    // For other commands, process with the LLM
    await interaction.deferReply();
    
    try {
      // Format the command and options for the LLM
      const optionsString = interaction.options.data
        .map(opt => `${opt.name}: ${opt.value}`)
        .join(', ');
      
      const prompt = `Command: /${commandName} ${optionsString}`;
      
      // Process the command with the LLM
      const response = await processMessage(prompt, bot);
      
      // Send the response
      await interaction.editReply(response);
    } catch (error) {
      logger.error('Error processing command with LLM:', error);
      await interaction.editReply('Sorry, I encountered an error processing your command.');
    }
  }
}

/**
 * Handles button interactions
 */
async function handleButtonInteraction(interaction: ButtonInteraction, bot: any): Promise<void> {
  // Get the button custom ID
  const buttonId = interaction.customId;
  
  logger.info(`Bot ${bot.name} received button interaction: ${buttonId}`);
  
  // Handle different button actions based on the customId
  if (buttonId.startsWith('help_')) {
    await interaction.reply({
      content: 'You clicked a help button. What can I assist you with?',
      ephemeral: true
    });
  } else {
    // For other button interactions, you can process with the LLM if needed
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const prompt = `User clicked button: ${buttonId}`;
      
      // Process the button interaction with the LLM
      const response = await processMessage(prompt, bot);
      
      // Send the response
      await interaction.editReply(response);
    } catch (error) {
      logger.error('Error processing button interaction with LLM:', error);
      await interaction.editReply('Sorry, I encountered an error processing your interaction.');
    }
  }
}

/**
 * Handles modal submit interactions
 * @param interaction Modal submit interaction
 * @param bot Bot data from database
 */
async function handleModalInteraction(interaction: ModalSubmitInteraction, bot: any): Promise<void> {
  // Extract the custom ID to identify which modal was submitted
  const modalId = interaction.customId;
  
  // Get all the field inputs from the modal
  const fields = interaction.fields.fields;
  const fieldValues: Record<string, string> = {};
  
  fields.forEach((value, key) => {
    fieldValues[key] = value.value;
  });
  
  // Acknowledge the interaction first
  await interaction.deferReply({ ephemeral: true });
  
  // Process based on modal type
  let response = '';
  
  if (modalId.startsWith('prompt_')) {
    // This is a custom prompt modal
    const userPrompt = fieldValues['prompt_text'] || 'No prompt provided';
    
    // Call LLM with the user's prompt
    const llmResponse = await callLLM({
      botId: bot.id,
      prompt: userPrompt,
      userId: interaction.user.id,
      username: interaction.user.username
    });
    
    response = llmResponse.text || "I don't have a response for that.";
  } else {
    // Default handling for unknown modals
    response = `Thank you for your submission!`;
  }
  
  // Send the response
  await interaction.followUp({
    content: response,
    ephemeral: true
  });
}

/**
 * Handles context menu command interactions (message and user context menus)
 * @param interaction Context menu interaction
 * @param bot Bot data from database
 */
async function handleContextMenuInteraction(interaction: ContextMenuCommandInteraction, bot: any): Promise<void> {
  // Extract the command name
  const commandName = interaction.commandName;
  
  // Acknowledge the interaction first
  await interaction.deferReply({ ephemeral: true });
  
  let response = '';
  
  // Handle different context menu commands
  if (commandName === 'Summarize Message' && interaction.isMessageContextMenuCommand()) {
    const targetMessage = interaction.targetMessage;
    const messageContent = targetMessage.content;
    
    if (!messageContent || messageContent.trim() === '') {
      response = "There's no text content to summarize in this message.";
    } else {
      // Call LLM to summarize the message
      const llmResponse = await callLLM({
        botId: bot.id,
        prompt: `Please summarize the following message concisely: "${messageContent}"`,
        userId: interaction.user.id,
        username: interaction.user.username
      });
      
      response = llmResponse.text || "I couldn't summarize that message.";
    }
  }
  else if (commandName === 'User Info' && interaction.isUserContextMenuCommand()) {
    const targetUser = interaction.targetUser;
    response = `User: ${targetUser.username}\nID: ${targetUser.id}\nCreated: ${targetUser.createdAt.toLocaleString()}`;
  }
  else {
    response = `Unknown context menu command: ${commandName}`;
  }
  
  // Send the response
  await interaction.followUp({
    content: response,
    ephemeral: true
  });
}

/**
 * Handles autocomplete interactions for slash commands
 * @param interaction Autocomplete interaction
 * @param bot Bot data from database
 */
async function handleAutocompleteInteraction(interaction: AutocompleteInteraction, bot: any): Promise<void> {
  const command = interaction.commandName;
  const focusedOption = interaction.options.getFocused(true);
  
  let choices: { name: string; value: string }[] = [];
  
  // Generate autocomplete options based on command and focused option
  if (command === 'help' && focusedOption.name === 'topic') {
    choices = [
      { name: 'Commands', value: 'commands' },
      { name: 'Features', value: 'features' },
      { name: 'Settings', value: 'settings' },
      { name: 'Personality', value: 'personality' },
      { name: 'Image Generation', value: 'images' },
      { name: 'Function Calling', value: 'functions' }
    ];
  }
  
  // Filter based on user input
  const filtered = choices.filter(choice => 
    choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
  
  // Respond with matching choices (max 25 choices as per Discord's limit)
  await interaction.respond(
    filtered.slice(0, 25)
  );
}

// Handle incoming Discord messages
export const handleMessage = async (client: Client, message: Message, bot: Bot) => {
  // Ignore messages from bots or without content
  if (message.author.bot || !message.content) return;

  // Check if the message mentions the bot
  const mentioned = message.mentions.has(client.user!.id);
  const isDirectMessage = message.channel.type === ChannelType.DM; // Use ChannelType enum

  if (!mentioned && !isDirectMessage) return;

  // Extract message content (remove mention if present)
  let content = message.content;
  if (mentioned) {
    content = content.replace(/<@!?\\d+>/, '').trim();
  }

  const channel = message.channel; // Use a variable for clarity

  // Check if channel is a type where we can send messages/typing indicators
  const isSendableChannel = channel.type === ChannelType.GuildText || channel.type === ChannelType.DM;

  if (isSendableChannel) {
    try {
       await channel.sendTyping();
    } catch (typingError) {
        // channel.id should be safe here as GuildText and DM channels have IDs
        logger.warn(`Could not send typing indicator in channel ${channel.id}:`, typingError);
    }
  } else {
     logger.warn(`Cannot send typing indicator in channel of type ${channel.type}`);
  }

  try {
    // 1. Get LLM Response (including potential tool calls)
    const llmResult: LLMResponse = await callLLM({
      botId: bot.id,
      prompt: content,
      userId: message.author.id,
      username: message.author.username
    });

    // 2. Handle Tool Calls if any
    let toolResults: any[] = [];
    if (bot.configuration?.toolsEnabled && llmResult.toolCalls && llmResult.toolCalls.length > 0) {
      // Check if channel supports sending messages before confirming tool use
       if (isSendableChannel) {
           try {
               await channel.send('🛠️ Using tools...');
           } catch (sendError) {
               logger.warn(`Could not send tool usage message in channel ${channel.id}:`, sendError);
           }
       }
      // Convert bot configuration tools to the required Tool type
      const adaptedTools = adaptBotToolsToToolType(bot.configuration.tools || []);
      toolResults = await executeTools(llmResult.toolCalls, adaptedTools);
    }

    // 3. Handle Image Generation if requested (example trigger: "/image")
    let imageUrl: string | null = null;
    const imageMatch = content.match(/\/image\s+(.*)/i);
    if (imageMatch && bot.configuration?.imageGeneration?.enabled) {
      const imagePrompt = imageMatch[1].trim();
       if (isSendableChannel) {
           try {
               await channel.send(`Generating image for: "${imagePrompt}" ...`);
           } catch (sendError) {
               logger.warn(`Could not send image generation message in channel ${channel.id}:`, sendError);
           }
       }
      try {
        // Adapt the image configuration to ensure the provider is always 'openai' for compatibility
        const adaptedConfig = adaptImageGenerationConfig(bot.configuration.imageGeneration);
        imageUrl = await generateImage(imagePrompt, adaptedConfig);
      } catch (imgError) {
        logger.error('Image generation failed:', imgError);
         if (isSendableChannel) {
             try {
                 await channel.send('Sorry, there was an error generating the image.');
             } catch (sendError) {
                 logger.warn(`Could not send image generation error message in channel ${channel.id}:`, sendError);
             }
         }
      }
    }

    // 4. Send Final Response(s)
    // Send LLM text response (split if necessary)
    if (llmResult.text) {
      const chunks = splitMessage(llmResult.text);
      for (const chunk of chunks) {
         if (isSendableChannel) {
             try {
                 await channel.send(chunk);
             } catch (sendError) {
                 logger.error(`Failed to send message chunk to channel ${channel.id}:`, sendError);
                 break;
             }
         } else {
             logger.error(`Cannot send message chunk to channel of type ${channel.type}`);
             break;
         }
      }
    } else if (!imageUrl && toolResults.length === 0) {
        // Send a default message if no other response was generated
         if (isSendableChannel) {
             try {
                await channel.send("I don't have a specific response for that right now.");
             } catch (sendError) {
                 logger.warn(`Could not send default message in channel ${channel.id}:`, sendError);
             }
         }
    }

    // Send Image URL if generated
    if (imageUrl) {
       if (isSendableChannel) {
           try {
               await channel.send(imageUrl);
           } catch (sendError) {
               logger.error(`Failed to send image URL to channel ${channel.id}:`, sendError);
           }
       }
    }

  } catch (error) {
    logger.error('Error handling message:', error);
     if (isSendableChannel) {
         try {
            await channel.send('Sorry, I encountered an error processing your request.');
         } catch (sendError) {
             logger.error(`Failed to send error message to channel ${channel.id}:`, sendError);
         }
     }
  }
};

// --- Helper Functions ---

// Renamed function parameter to avoid conflict with imported executeTools
async function processToolCalls(toolCalls: any[], bot: Bot): Promise<any[]> {
    const results = [];
    for (const call of toolCalls) {
        try {
            // Assuming 'call' has function name and arguments
            const functionName = call.function?.name;
            const functionArgs = JSON.parse(call.function?.arguments || '{}'); // Safely parse args
            const toolId = call.id; // ID to map result back to the call

            if (!functionName) continue;

            // Find the tool configuration
            const tool = bot.configuration?.tools?.find((t: { name: string }) => t.name === functionName);
            if (!tool) {
                results.push({ tool_call_id: toolId, output: `Error: Tool '${functionName}' not found.` });
                continue;
            }

            // Execute the tool
            const adaptedTools = adaptBotToolsToToolType(bot.configuration?.tools || []);
            const toolExecutionResult = await executeTools([call], adaptedTools);
            // Extract the actual output from the result
            const output = toolExecutionResult.length > 0 ? toolExecutionResult[0].result : 'Error: Tool execution failed or returned no result.';

            results.push({ tool_call_id: toolId, output: JSON.stringify(output) }); // Stringify output for LLM

        } catch (error) {
            logger.error(`Error processing tool call ${call.id}:`, error);
            results.push({ tool_call_id: call.id, output: `Error: Failed to execute tool ${call.function?.name}.` });
        }
    }
    return results;
}


function splitMessage(text: string, maxLength = 2000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  // Split by lines first to try and preserve code blocks/formatting
  const lines = text.split('\\n');

  for (const line of lines) {
    // If a single line is too long, split it by words
    if (line.length > maxLength) {
        // Flush the current chunk if it exists
        if (currentChunk) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        
        const words = line.split(' ');
        let longLineChunk = '';
        for(const word of words) {
            if ((longLineChunk + word + ' ').length <= maxLength) {
                longLineChunk += word + ' ';
            } else {
                chunks.push(longLineChunk.trim());
                longLineChunk = word + ' ';
            }
        }
         if (longLineChunk) { // Add the remainder of the long line
            chunks.push(longLineChunk.trim());
        }

    } else if ((currentChunk + line + '\\n').length <= maxLength) {
      currentChunk += line + '\\n';
    } else {
      // Push the current chunk and start a new one
      chunks.push(currentChunk.trim());
      currentChunk = line + '\\n';
    }
  }

  // Push the last remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0); // Remove empty chunks
}

// Simple wrapper for callLLM for backward compatibility
async function processMessage(prompt: string, bot: Bot): Promise<string> {
  try {
    const result = await callLLM({
      botId: bot.id,
      prompt,
      userId: 'system',
      username: 'system'
    });
    
    return result.text || "I don't have a response for that.";
  } catch (error) {
    logger.error('Error processing message:', error);
    return 'Sorry, I encountered an error processing your request.';
  }
}

/**
 * Adapts bot configuration tools to the required Tool type with implementation
 * This is needed because the tools in bot configuration don't include implementation
 */
function adaptBotToolsToToolType(configTools: Array<{
  id: string;
  name: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}>): Tool[] {
  return configTools.map(tool => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters || [],
    // Default implementation that returns the input arguments
    implementation: `
      return {
        result: {
          success: true,
          args: args,
          message: "This is a placeholder implementation for the ${tool.name} tool."
        }
      };
    `
  }));
}

/**
 * Adapts bot configuration image generation config to the required ImageGenerationConfig type
 */
function adaptImageGenerationConfig(config: {
  enabled: boolean;
  provider: string;
  apiKey?: string;
  model?: string;
}) {
  // Map any provider string to one of the allowed enum values
  let provider: "openai" | "stability" | "midjourney" = "openai";
  
  // If the provided value is already one of the allowed types, use it
  if (config.provider === "openai" || config.provider === "stability" || config.provider === "midjourney") {
    provider = config.provider;
  } 
  // Otherwise default to openai since we're standardizing on OpenAI-compatible APIs
  
  return {
    enabled: config.enabled,
    provider,
    apiKey: config.apiKey,
    model: config.model
  };
}
