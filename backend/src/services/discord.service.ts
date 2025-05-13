import { TokenValidationResult } from "@discura/common";
import axios from "axios";
import { Client, GatewayIntentBits } from "discord.js";

import { logger } from "../utils/logger";

/**
 * Service for Discord API related operations
 */

/**
 * Validates a Discord bot token and checks if message content intent is enabled
 *
 * @param token The Discord bot token to validate
 * @returns TokenValidationResult with validation status and intent information
 */
export async function validateBotToken(
  token: string,
): Promise<TokenValidationResult> {
  try {
    // Get bot information using the token
    const response = await axios.get("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.data || !response.data.id) {
      return {
        valid: false,
        messageContentEnabled: false,
        error: "Invalid token: Could not retrieve bot information",
      };
    }

    // Try to connect to the Discord Gateway with Message Content Intent
    let client: Client | null = null;
    try {
      client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      // Try to login
      await client.login(token);

      // If login succeeds, Message Content Intent is enabled
      await client.destroy();
      return {
        valid: true,
        messageContentEnabled: true,
        botId: response.data.id,
        username: response.data.username,
      };
    } catch (intentError: any) {
      if (client) await client.destroy();
      logger.error("Message Content Intent check failed:", intentError);
      return {
        valid: true,
        messageContentEnabled: false,
        botId: response.data.id,
        username: response.data.username,
        error:
          intentError?.message ||
          "Message Content Intent is not enabled or token is missing required permissions.",
      };
    }
  } catch (error) {
    logger.error("Error validating Discord token:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return {
          valid: false,
          messageContentEnabled: false,
          error: "Invalid token: Authentication failed",
        };
      } else if (error.response?.status === 403) {
        return {
          valid: false,
          messageContentEnabled: false,
          error: "Invalid token: Permission denied",
        };
      } else if (error.response?.status === 429) {
        return {
          valid: false,
          messageContentEnabled: false,
          error: "Rate limited: Please try again later",
        };
      }
    }
    return {
      valid: false,
      messageContentEnabled: false,
      error: "Failed to validate token: Network or server error",
    };
  }
}
