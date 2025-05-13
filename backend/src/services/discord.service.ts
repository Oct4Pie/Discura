import { TokenValidationResult } from "@discura/common";
import axios from "axios";

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

    // Now check if the bot has the message content intent enabled
    // We need to get the application from the Discord API
    try {
      const applicationResponse = await axios.get(
        "https://discord.com/api/v10/oauth2/applications/@me",
        {
          headers: {
            Authorization: `Bot ${token}`,
          },
        },
      );

      // Check if the bot has the message content intent flag set
      // Message content intent is represented by the value 1 << 15 (32768) in the flags
      // See: https://discord.com/developers/docs/topics/gateway#gateway-intents
      const messageContentIntent = 1 << 15;

      // The intent flags are in the flags field
      const botFlags = applicationResponse.data.flags || 0;
      const messageContentEnabled =
        (botFlags & messageContentIntent) === messageContentIntent;

      return {
        valid: true,
        messageContentEnabled,
        botId: response.data.id,
        username: response.data.username,
        error: messageContentEnabled
          ? undefined
          : "Message content intent is not enabled for this bot",
      };
    } catch (appError) {
      logger.error("Error fetching application data:", appError);

      // Token is valid (we got user data) but we couldn't verify intents
      return {
        valid: true,
        messageContentEnabled: false,
        botId: response.data.id,
        username: response.data.username,
        error: "Could not verify message content intent status",
      };
    }
  } catch (error) {
    logger.error("Error validating Discord token:", error);

    // Check for specific error codes to provide better error messages
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
