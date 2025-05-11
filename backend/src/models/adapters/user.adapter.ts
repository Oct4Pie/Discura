import { v4 as uuidv4 } from 'uuid';
import { db } from '../../services/database/database.factory';
import { logger } from '../../utils/logger';
import { UserResponseDto } from '@discura/common/schema/types';

/**
 * User data from the database
 * This interface is only used for database interactions and should be kept internal
 */
interface UserDbEntity {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User model with additional methods
 * Acts as a bridge between database entities and API DTOs
 */
export class User {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(data: UserDbEntity) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar;
    this.email = data.email;
    this.createdAt = new Date(data.created_at);
    this.updatedAt = new Date(data.updated_at);
  }
  
  /**
   * Convert to a UserResponseDto for API responses
   * This ensures adherence to the common API types (single source of truth)
   */
  toDTO(): UserResponseDto {
    return {
      id: this.id,
      discordId: this.discordId,
      username: this.username,
      discriminator: this.discriminator,
      avatar: this.avatar || '',
      email: this.email || '',
      bots: [] // This would be populated separately when needed
    };
  }
}

/**
 * Adapter for user model operations
 * Provides an interface between the application and the database
 */
export class UserAdapter {
  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const userData = await db.get<UserDbEntity>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      if (!userData) {
        return null;
      }
      
      return new User(userData);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      return null;
    }
  }
  
  /**
   * Find a user by Discord ID
   */
  static async findByDiscordId(discordId: string): Promise<User | null> {
    try {
      const userData = await db.get<UserDbEntity>(
        'SELECT * FROM users WHERE discord_id = ?',
        [discordId]
      );
      
      if (!userData) {
        return null;
      }
      
      return new User(userData);
    } catch (error) {
      logger.error('Error finding user by Discord ID:', error);
      return null;
    }
  }
  
  /**
   * Create a new user
   */
  static async create(data: {
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email: string | null;
  }): Promise<User | null> {
    try {
      const now = new Date().toISOString();
      const id = uuidv4();
      
      await db.insert('users', {
        id,
        discord_id: data.discordId,
        username: data.username,
        discriminator: data.discriminator,
        avatar: data.avatar,
        email: data.email,
        created_at: now,
        updated_at: now
      });
      
      return UserAdapter.findById(id);
    } catch (error) {
      logger.error('Error creating user:', error);
      return null;
    }
  }
  
  /**
   * Update a user
   */
  static async update(id: string, data: Partial<{
    username: string;
    discriminator: string;
    avatar: string | null;
    email: string | null;
  }>): Promise<User | null> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      await db.update('users', updateData, 'id = ?', [id]);
      
      return UserAdapter.findById(id);
    } catch (error) {
      logger.error('Error updating user:', error);
      return null;
    }
  }
  
  /**
   * Create or update a user from Discord profile
   * This is used during authentication to ensure user data is up-to-date
   */
  static async createFromDiscord(profile: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
  }): Promise<User | null> {
    try {
      // First, check if the user already exists
      const existingUser = await UserAdapter.findByDiscordId(profile.id);
      
      if (existingUser) {
        // Update existing user
        return await UserAdapter.update(existingUser.id, {
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          email: profile.email || null
        });
      } else {
        // Create new user
        return await UserAdapter.create({
          discordId: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          email: profile.email || null
        });
      }
    } catch (error) {
      logger.error('Error creating/updating user from Discord profile:', error);
      return null;
    }
  }
  
  /**
   * Delete a user
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete('users', 'id = ?', [id]);
      return result > 0;
    } catch (error) {
      logger.error('Error deleting user:', error);
      return false;
    }
  }
}