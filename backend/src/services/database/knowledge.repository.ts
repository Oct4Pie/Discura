import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { db } from './database.factory';
import { logger } from '../../utils/logger';

/**
 * Knowledge item entity representing a row in the knowledge_items table
 */
export interface KnowledgeItemEntity {
  id?: number;
  bot_id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * KnowledgeRepository - Manages knowledge item data operations
 */
export class KnowledgeRepository extends BaseRepository<KnowledgeItemEntity> {
  private static instance: KnowledgeRepository;

  private constructor() {
    super('knowledge_items');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KnowledgeRepository {
    if (!KnowledgeRepository.instance) {
      KnowledgeRepository.instance = new KnowledgeRepository();
    }
    return KnowledgeRepository.instance;
  }

  /**
   * Find knowledge items by bot ID
   */
  async findByBotId(botId: string): Promise<KnowledgeItemEntity[]> {
    try {
      return await this.findByField('bot_id', botId);
    } catch (error) {
      logger.error(`Error fetching knowledge items for bot ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new knowledge item
   */
  async createKnowledgeItem(item: Omit<KnowledgeItemEntity, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeItemEntity> {
    try {
      const now = new Date().toISOString();
      const knowledgeItem: KnowledgeItemEntity = {
        ...item,
        created_at: now,
        updated_at: now
      };

      const id = await this.create(knowledgeItem);
      return {
        ...knowledgeItem,
        id: id as number
      };
    } catch (error) {
      logger.error('Error creating knowledge item:', error);
      throw error;
    }
  }

  /**
   * Update a knowledge item
   */
  async updateKnowledgeItem(id: number, updates: Partial<KnowledgeItemEntity>): Promise<boolean> {
    try {
      const updatedItem = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Delete any id field from updates to prevent overwriting the primary key
      delete updatedItem.id;
      
      return await db.update(
        this.tableName,
        updatedItem,
        'id = ?',
        [id]
      ) > 0;
    } catch (error) {
      logger.error(`Error updating knowledge item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a knowledge item
   */
  async deleteKnowledgeItem(id: number): Promise<boolean> {
    try {
      return await db.delete(this.tableName, 'id = ?', [id]) > 0;
    } catch (error) {
      logger.error(`Error deleting knowledge item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all knowledge items for a bot
   */
  async deleteAllForBot(botId: string): Promise<boolean> {
    try {
      return await db.delete(this.tableName, 'bot_id = ?', [botId]) > 0;
    } catch (error) {
      logger.error(`Error deleting all knowledge items for bot ${botId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const knowledgeRepository = KnowledgeRepository.getInstance();