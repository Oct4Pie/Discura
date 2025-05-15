import fs from "fs";
import path from "path";
import { promisify } from "util";
import { logger } from "../utils/logger";

// Interface representing a conversation message
export interface ConversationMessage {
  role: string;
  content: string;
  userId?: string;
  username: string; // Changed from optional to required
  timestamp: number; // Changed from optional to required
}

// Interface representing a conversation history entry
export interface ConversationHistoryEntry {
  key: string;
  channelId: string;
  botId: string;
  messages: ConversationMessage[];
  updatedAt: number;
}

// Convert fs functions to promise-based
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
const readdirAsync = promisify(fs.readdir);

// Path to store conversation histories
const HISTORY_DIR = path.join(process.cwd(), "data", "conversation-histories");

// In-memory cache of conversation histories
const conversationHistoryCache = new Map<string, ConversationMessage[]>();

// Maximum number of messages to keep in history
const MAX_HISTORY_LENGTH = 20; // Increased from 10 to 20 to provide more context

// Initialize the history directory
export const initializeHistoryStorage = async (): Promise<void> => {
  try {
    // Check if directory exists, if not create it
    try {
      await accessAsync(HISTORY_DIR);
    } catch (error) {
      logger.info(`Creating conversation history directory at ${HISTORY_DIR}`);
      await mkdirAsync(HISTORY_DIR, { recursive: true });
    }

    logger.info("Conversation history storage initialized");
  } catch (error) {
    logger.error("Failed to initialize conversation history storage:", error);
    throw error;
  }
};

// Get the filename for a conversation history - Now based only on botId and channelId
const getHistoryFilename = (channelId: string, botId: string): string => {
  return path.join(HISTORY_DIR, `${botId}_${channelId}.json`);
};

// Generate a cache key - Now based only on botId and channelId
const getHistoryKey = (channelId: string, botId: string): string => {
  return `${botId}_${channelId}`;
};

// Get conversation history from cache or storage
export const getConversationHistory = async (
  channelId: string,
  botId: string
): Promise<ConversationMessage[]> => {
  const key = getHistoryKey(channelId, botId);

  // Check cache first
  if (conversationHistoryCache.has(key)) {
    return conversationHistoryCache.get(key) || [];
  }

  // If not in cache, try to load from file
  try {
    const filename = getHistoryFilename(channelId, botId);

    try {
      await accessAsync(filename);
    } catch (error) {
      // File doesn't exist, return empty array and cache it
      conversationHistoryCache.set(key, []);
      return [];
    }

    // Read and parse file
    const data = await readFileAsync(filename, "utf8");
    const history: ConversationHistoryEntry = JSON.parse(data);

    // Cache the loaded history
    conversationHistoryCache.set(key, history.messages);

    return history.messages;
  } catch (error) {
    logger.error(`Error loading conversation history for ${key}:`, error);
    // Return empty array on error
    conversationHistoryCache.set(key, []);
    return [];
  }
};

// Add a message to conversation history and persist it
export const addToConversationHistory = async (
  channelId: string,
  userId: string,
  botId: string,
  role: string,
  content: string,
  username: string // Changed from optional to required
): Promise<void> => {
  const key = getHistoryKey(channelId, botId);

  // Get existing history (either from cache or storage)
  const history = await getConversationHistory(channelId, botId);

  // Create new message with timestamp
  const message: ConversationMessage = {
    role,
    content,
    userId: role === "user" ? userId : undefined,
    username: username || (role === "assistant" ? "Bot" : "Unknown User"),
    timestamp: Date.now(),
  };

  // Add to history
  history.push(message);

  // Trim history if it exceeds maximum length
  while (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }

  // Update cache
  conversationHistoryCache.set(key, history);

  // Persist to file
  try {
    const entry: ConversationHistoryEntry = {
      key,
      channelId,
      botId,
      messages: history,
      updatedAt: Date.now(),
    };

    const filename = getHistoryFilename(channelId, botId);
    await writeFileAsync(filename, JSON.stringify(entry, null, 2));
  } catch (error) {
    logger.error(`Error saving conversation history for ${key}:`, error);
  }
};

// Load all conversation histories for a bot
export const loadAllBotConversationHistories = async (
  botId: string
): Promise<void> => {
  try {
    // Ensure the directory exists
    try {
      await accessAsync(HISTORY_DIR);
    } catch (error) {
      // Directory doesn't exist, nothing to load
      return;
    }

    // Read all files in the directory
    const files = await readdirAsync(HISTORY_DIR);

    // Filter for files belonging to this bot
    const botFiles = files.filter(
      (file) => file.startsWith(`${botId}_`) && file.endsWith(".json")
    );

    logger.info(
      `Loading ${botFiles.length} conversation histories for bot ${botId}`
    );

    // Load each file into the cache
    for (const file of botFiles) {
      try {
        const data = await readFileAsync(path.join(HISTORY_DIR, file), "utf8");
        const history: ConversationHistoryEntry = JSON.parse(data);

        // Add to cache
        conversationHistoryCache.set(history.key, history.messages);
      } catch (error) {
        logger.error(`Error loading conversation history file ${file}:`, error);
      }
    }

    logger.info(`Loaded conversation histories for bot ${botId}`);
  } catch (error) {
    logger.error(
      `Error loading conversation histories for bot ${botId}:`,
      error
    );
  }
};

// Clear conversation histories for a bot
export const clearBotConversationHistories = async (
  botId: string
): Promise<void> => {
  try {
    // Ensure the directory exists
    try {
      await accessAsync(HISTORY_DIR);
    } catch (error) {
      // Directory doesn't exist, nothing to clear
      return;
    }

    // Read all files in the directory
    const files = await readdirAsync(HISTORY_DIR);

    // Filter for files belonging to this bot
    const botFiles = files.filter(
      (file) => file.startsWith(`${botId}_`) && file.endsWith(".json")
    );

    logger.info(
      `Clearing ${botFiles.length} conversation histories for bot ${botId}`
    );

    // Delete each file
    for (const file of botFiles) {
      try {
        await promisify(fs.unlink)(path.join(HISTORY_DIR, file));

        // Also remove from cache
        const key = file.replace(".json", "");
        conversationHistoryCache.delete(key);
      } catch (error) {
        logger.error(
          `Error deleting conversation history file ${file}:`,
          error
        );
      }
    }

    logger.info(`Cleared conversation histories for bot ${botId}`);
  } catch (error) {
    logger.error(
      `Error clearing conversation histories for bot ${botId}:`,
      error
    );
  }
};

// Migrate existing conversation histories to the new format
// This function can be called once during app initialization
export const migrateConversationHistories = async (): Promise<void> => {
  try {
    // Ensure the directory exists
    try {
      await accessAsync(HISTORY_DIR);
    } catch (error) {
      // Directory doesn't exist, nothing to migrate
      return;
    }

    // Read all files in the directory
    const files = await readdirAsync(HISTORY_DIR);

    // Filter for old format files (containing two underscores)
    const oldFormatFiles = files.filter(
      (file) => file.endsWith(".json") && file.split("_").length === 3
    );

    if (oldFormatFiles.length === 0) {
      logger.info("No conversation histories to migrate");
      return;
    }

    logger.info(
      `Found ${oldFormatFiles.length} conversation histories to migrate`
    );

    // Group files by botId_channelId
    const grouped = new Map<string, string[]>();

    for (const file of oldFormatFiles) {
      const [botId, channelId, userId] = file.replace(".json", "").split("_");
      const newKey = `${botId}_${channelId}`;

      if (!grouped.has(newKey)) {
        grouped.set(newKey, []);
      }

      grouped.get(newKey)?.push(file);
    }

    // Process each group
    for (const [newKey, files] of grouped.entries()) {
      const [botId, channelId] = newKey.split("_");
      const allMessages: ConversationMessage[] = [];

      // Read all files in the group and collect messages
      for (const file of files) {
        try {
          const data = await readFileAsync(
            path.join(HISTORY_DIR, file),
            "utf8"
          );
          const history: ConversationHistoryEntry = JSON.parse(data);

          // Ensure all messages have username and timestamp
          const enhancedMessages = history.messages.map((msg) => ({
            ...msg,
            username:
              msg.username ||
              (msg.role === "assistant" ? "Bot" : "Unknown User"),
            timestamp: msg.timestamp || Date.now(),
          }));

          allMessages.push(...enhancedMessages);
        } catch (error) {
          logger.error(
            `Error reading conversation history file ${file} during migration:`,
            error
          );
        }
      }

      // Sort messages by timestamp
      allMessages.sort((a, b) => a.timestamp - b.timestamp);

      // Trim if needed
      while (allMessages.length > MAX_HISTORY_LENGTH) {
        allMessages.shift();
      }

      // Create new entry
      const entry: ConversationHistoryEntry = {
        key: newKey,
        channelId,
        botId,
        messages: allMessages,
        updatedAt: Date.now(),
      };

      // Save new file
      const newFilename = getHistoryFilename(channelId, botId);
      await writeFileAsync(newFilename, JSON.stringify(entry, null, 2));

      // Update cache
      conversationHistoryCache.set(newKey, allMessages);

      // Delete old files - commented out for safety during migration
      // Uncomment after verifying migration works correctly
      /*
      for (const file of files) {
        try {
          await promisify(fs.unlink)(path.join(HISTORY_DIR, file));
        } catch (error) {
          logger.error(`Error deleting old conversation history file ${file}:`, error);
        }
      }
      */
    }

    logger.info(
      `Successfully migrated ${oldFormatFiles.length} conversation histories to the new format`
    );
  } catch (error) {
    logger.error("Error during conversation history migration:", error);
  }
};

// Flush a portion of conversation history for a specific channel
export const flushConversationHistory = async (
  channelId: string,
  botId: string,
  count?: number
): Promise<number> => {
  try {
    const key = getHistoryKey(channelId, botId);

    // Get existing history
    const history = await getConversationHistory(channelId, botId);

    if (history.length === 0) {
      // Nothing to flush
      return 0;
    }

    // Determine how many messages to remove
    let messagesToRemove: number;
    if (count !== undefined && count > 0) {
      // Remove the specific count of messages from the beginning
      messagesToRemove = Math.min(count, history.length);
    } else {
      // Default: Remove 10% of the messages rounded up
      messagesToRemove = Math.max(1, Math.ceil(history.length * 0.1));
    }

    // Remove messages from the beginning of the array
    history.splice(0, messagesToRemove);

    // Update cache
    conversationHistoryCache.set(key, history);

    // Persist to file
    try {
      const entry: ConversationHistoryEntry = {
        key,
        channelId,
        botId,
        messages: history,
        updatedAt: Date.now(),
      };

      const filename = getHistoryFilename(channelId, botId);
      await writeFileAsync(filename, JSON.stringify(entry, null, 2));

      logger.info(
        `Flushed ${messagesToRemove} messages from conversation history for channel ${channelId}`
      );
      return messagesToRemove;
    } catch (error) {
      logger.error(
        `Error saving flushed conversation history for ${key}:`,
        error
      );
      throw error;
    }
  } catch (error) {
    logger.error(
      `Error flushing conversation history for channel ${channelId}:`,
      error
    );
    throw error;
  }
};

// Reset (clear) entire conversation history for a specific channel
export const resetConversationHistory = async (
  channelId: string,
  botId: string
): Promise<number> => {
  try {
    const key = getHistoryKey(channelId, botId);

    // Get existing history to determine how many messages were cleared
    const history = await getConversationHistory(channelId, botId);
    const messageCount = history.length;

    if (messageCount === 0) {
      // No history to reset
      return 0;
    }

    // Clear the history
    conversationHistoryCache.set(key, []);

    // Delete the file if it exists
    const filename = getHistoryFilename(channelId, botId);
    try {
      await accessAsync(filename);
      await promisify(fs.unlink)(filename);
      logger.info(`Reset conversation history file for channel ${channelId}`);
    } catch (error) {
      // File doesn't exist, that's okay
      logger.debug(`No history file to delete for channel ${channelId}`);
    }

    // Create an empty history file
    const entry: ConversationHistoryEntry = {
      key,
      channelId,
      botId,
      messages: [],
      updatedAt: Date.now(),
    };

    await writeFileAsync(filename, JSON.stringify(entry, null, 2));
    logger.info(
      `Reset ${messageCount} messages from conversation history for channel ${channelId}`
    );

    return messageCount;
  } catch (error) {
    logger.error(
      `Error resetting conversation history for channel ${channelId}:`,
      error
    );
    throw error;
  }
};

// Clear (remove) recent messages from conversation history for a specific channel
export const clearConversationHistory = async (
  channelId: string,
  botId: string,
  count?: number
): Promise<number> => {
  try {
    const key = getHistoryKey(channelId, botId);
    
    // Get existing history
    const history = await getConversationHistory(channelId, botId);
    
    if (history.length === 0) {
      // Nothing to clear
      return 0;
    }

    // Determine how many messages to remove
    let messagesToRemove: number;
    if (count !== undefined && count > 0) {
      // Remove the specific count of messages from the end (most recent)
      messagesToRemove = Math.min(count, history.length);
    } else {
      // Default: Remove 10% of the messages rounded up
      messagesToRemove = Math.max(1, Math.ceil(history.length * 0.1));
    }

    // Remove messages from the end of the array (most recent messages)
    history.splice(history.length - messagesToRemove, messagesToRemove);
    
    // Update cache
    conversationHistoryCache.set(key, history);
    
    // Persist to file
    try {
      const entry: ConversationHistoryEntry = {
        key,
        channelId,
        botId,
        messages: history,
        updatedAt: Date.now(),
      };
      
      const filename = getHistoryFilename(channelId, botId);
      await writeFileAsync(filename, JSON.stringify(entry, null, 2));
      
      logger.info(`Cleared ${messagesToRemove} recent messages from conversation history for channel ${channelId}`);
      return messagesToRemove;
    } catch (error) {
      logger.error(`Error saving cleared conversation history for ${key}:`, error);
      throw error;
    }
  } catch (error) {
    logger.error(`Error clearing recent conversation history for channel ${channelId}:`, error);
    throw error;
  }
};
