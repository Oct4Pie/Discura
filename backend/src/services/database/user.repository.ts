import { v4 as uuidv4 } from "uuid";

import { BaseRepository } from "./base.repository";
import { db } from "./database.factory";
import { logger } from "../../utils/logger";

/**
 * User entity representing a row in the users table
 */
export interface UserEntity {
  id: string;
  discord_id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * UserRepository - Manages user data operations
 */
export class UserRepository extends BaseRepository<UserEntity> {
  private static instance: UserRepository;

  private constructor() {
    super("users");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  /**
   * Find a user by Discord ID
   */
  async findByDiscordId(discordId: string): Promise<UserEntity | undefined> {
    const result = await this.findOneByField("discord_id", discordId);
    return result === null ? undefined : result;
  }

  /**
   * Create a new user from Discord data
   */
  async createFromDiscord(discordUser: any): Promise<UserEntity> {
    try {
      const user: Partial<UserEntity> = {
        id: uuidv4(),
        discord_id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator || undefined,
        avatar: discordUser.avatar || undefined,
        email: discordUser.email || undefined,
      };

      await this.create(user);

      return user as UserEntity;
    } catch (error) {
      logger.error("Error creating user from Discord data:", error);
      throw error;
    }
  }

  /**
   * Update a user's Discord profile data
   */
  async updateDiscordProfile(
    discordId: string,
    profileData: Partial<UserEntity>,
  ): Promise<boolean> {
    try {
      const user = await this.findByDiscordId(discordId);

      if (!user) {
        return false;
      }

      // Update only allowed fields
      const allowedUpdates: Partial<UserEntity> = {
        username: profileData.username,
        discriminator: profileData.discriminator,
        avatar: profileData.avatar,
        email: profileData.email,
        updated_at: new Date().toISOString(),
      };

      // Filter out undefined values
      Object.keys(allowedUpdates).forEach((key) => {
        if (allowedUpdates[key as keyof UserEntity] === undefined) {
          delete allowedUpdates[key as keyof UserEntity];
        }
      });

      return await this.update(user.id, allowedUpdates);
    } catch (error) {
      logger.error("Error updating user Discord profile:", error);
      throw error;
    }
  }

  /**
   * Get user's bots (IDs only)
   */
  async getUserBotIds(userId: string): Promise<string[]> {
    try {
      const botRows = await db.query<{ id: string }>(
        "SELECT id FROM bots WHERE user_id = ?",
        [userId],
      );

      return botRows.map((row) => row.id);
    } catch (error) {
      logger.error("Error fetching user bot IDs:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = UserRepository.getInstance();
