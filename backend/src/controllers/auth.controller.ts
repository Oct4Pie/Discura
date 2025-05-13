import {
  ErrorResponseDto,
  MessageResponseDto,
  UserProfileResponseDto,
  UserResponseDto,
  BotResponseDto,
} from "@discura/common/";
import { AuthController as CommonAuthController } from "@discura/common/controllers";
import { JwtPayload } from "@discura/common/types/auth";
import { Request } from "express";
import jwt from "jsonwebtoken";

import config from "../config";
import { BotAdapter } from "../models/adapters/bot.adapter";
import { UserAdapter } from "../models/user.model";
import { logger } from "../utils/logger";

/**
 * Implementation of the AuthController for handling authentication
 */
export class AuthController extends CommonAuthController {
  /**
   * Login with credentials
   */
  public async login(
    request: Request,
  ): Promise<UserResponseDto | ErrorResponseDto> {
    try {
      // In a production implementation, this would:
      // 1. Validate user credentials
      // 2. Generate a JWT
      // 3. Return user information

      // For now, we'll create a mock user response
      // In a real implementation, this would come from your database

      // Create a mock user object
      const user: UserResponseDto = {
        id: "123456",
        discordId: "987654321",
        username: "test_user",
        discriminator: "1234",
        avatar: "default_avatar.png",
        email: "test@example.com",
        bots: [],
      };

      // Generate a JWT for the user
      const token = jwt.sign(
        {
          id: user.id,
          discordId: user.discordId,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
          email: user.email,
        } as JwtPayload,
        config.jwtSecret,
        { expiresIn: "24h" },
      );

      // In a real implementation, you'd store the token in the session
      // or add it to the response headers or cookies

      logger.info(`User ${user.id} logged in`);

      return user;
    } catch (error) {
      logger.error("Error in login:", error);
      return {
        message: "Login failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Register a new user
   */
  public async register(
    request: Request,
  ): Promise<UserResponseDto | ErrorResponseDto> {
    try {
      // In a production implementation, this would:
      // 1. Create a new user in the database
      // 2. Generate a JWT
      // 3. Return user information

      // For now, we'll create a mock user response
      const user: UserResponseDto = {
        id: "new_" + Date.now().toString(),
        discordId: "new_discord_" + Date.now().toString(),
        username: "new_user",
        discriminator: "5678",
        avatar: "new_avatar.png",
        email: "new_user@example.com",
        bots: [],
      };

      logger.info(`New user registered: ${user.id}`);

      return user;
    } catch (error) {
      logger.error("Error in register:", error);
      return {
        message: "Registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get current user profile
   *
   * Retrieves complete user data from the database using the user ID from JWT payload
   */
  public async getProfile(
    request: Request,
  ): Promise<UserProfileResponseDto | ErrorResponseDto> {
    try {
      // Extract authenticated user payload from the JWT
      const payload = (request as any).user as JwtPayload;

      if (!payload) {
        throw new Error("User not authenticated");
      }

      // Fetch complete user data from database
      const user = await UserAdapter.findById(payload.id);

      if (!user) {
        throw new Error("User not found in database");
      }

      // Fetch user's bots
      const userBots = await BotAdapter.findByUserId(user.id);

      // Extract bot IDs for the user profile
      const botIds = userBots.map((bot) => bot.id);

      logger.info(`Retrieved profile for user ${user.id}`);

      // Return complete user profile with bot IDs following the UserProfileResponseDto structure
      // This ensures we adhere to the single source of truth in the common API types
      return {
        user: {
          id: user.id,
          discordId: user.discordId,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar || "",
          email: user.email || "",
          bots: botIds,
        },
      };
    } catch (error) {
      logger.error("Error in getProfile:", error);
      return {
        message: "Failed to get user profile",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Logout current user
   */
  public async logout(
    request: Request,
  ): Promise<MessageResponseDto | ErrorResponseDto> {
    try {
      // In a production implementation with sessions, this would:
      // 1. Invalidate the user's session
      // 2. Clear auth cookies or request the client to remove the JWT

      // For now, just return a success message

      logger.info("User logged out");

      return { message: "Logged out successfully" };
    } catch (error) {
      logger.error("Error in logout:", error);
      return {
        message: "Logout failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
