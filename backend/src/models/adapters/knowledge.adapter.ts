import { db } from '../../services/database/database.factory';
import { logger } from '../../utils/logger';

/**
 * Knowledge item DTO for API responses
 */
export interface KnowledgeItemDto {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Knowledge item data from the database
 */
export interface KnowledgeData {
  id: number;
  bot_id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Knowledge item model with additional methods
 */
export class KnowledgeItem {
  id: number;
  botId: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(data: KnowledgeData) {
    this.id = data.id;
    this.botId = data.bot_id;
    this.title = data.title;
    this.content = data.content;
    this.type = data.type;
    this.priority = data.priority;
    this.createdAt = new Date(data.created_at);
    this.updatedAt = new Date(data.updated_at);
  }
  
  /**
   * Convert to a DTO for API responses
   */
  toDTO(): KnowledgeItemDto {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      type: this.type,
      priority: this.priority,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

/**
 * Adapter for knowledge item operations
 */
export class KnowledgeAdapter {
  /**
   * Find a knowledge item by ID
   */
  static async findById(id: number, botId: string): Promise<KnowledgeItem | null> {
    try {
      const data = await db.get<KnowledgeData>(
        'SELECT * FROM knowledge_items WHERE id = ? AND bot_id = ?',
        [id, botId]
      );
      
      if (!data) {
        return null;
      }
      
      return new KnowledgeItem(data);
    } catch (error) {
      logger.error('Error finding knowledge item by ID:', error);
      return null;
    }
  }
  
  /**
   * Find all knowledge items for a bot
   */
  static async findByBotId(botId: string): Promise<KnowledgeItem[]> {
    try {
      const dataList = await db.query<KnowledgeData>(
        'SELECT * FROM knowledge_items WHERE bot_id = ? ORDER BY priority DESC, created_at DESC',
        [botId]
      );
      
      return dataList.map(data => new KnowledgeItem(data));
    } catch (error) {
      logger.error('Error finding knowledge items by bot ID:', error);
      return [];
    }
  }
  
  /**
   * Create a new knowledge item
   */
  static async create(data: {
    botId: string;
    title: string;
    content: string;
    type?: string;
    priority?: number;
  }): Promise<KnowledgeItem | null> {
    try {
      const now = new Date().toISOString();
      
      const insertId = await db.insert('knowledge_items', {
        bot_id: data.botId,
        title: data.title,
        content: data.content,
        type: data.type || 'text',
        priority: data.priority || 0,
        created_at: now,
        updated_at: now
      });
      
      return KnowledgeAdapter.findById(Number(insertId), data.botId);
    } catch (error) {
      logger.error('Error creating knowledge item:', error);
      return null;
    }
  }
  
  /**
   * Update a knowledge item
   */
  static async update(
    id: number,
    botId: string,
    data: Partial<{
      title: string;
      content: string;
      type: string;
      priority: number;
    }>
  ): Promise<KnowledgeItem | null> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      await db.update(
        'knowledge_items',
        updateData,
        'id = ? AND bot_id = ?',
        [id, botId]
      );
      
      return KnowledgeAdapter.findById(id, botId);
    } catch (error) {
      logger.error('Error updating knowledge item:', error);
      return null;
    }
  }
  
  /**
   * Delete a knowledge item
   */
  static async delete(id: number, botId: string): Promise<boolean> {
    try {
      const result = await db.delete(
        'knowledge_items',
        'id = ? AND bot_id = ?',
        [id, botId]
      );
      
      return result > 0;
    } catch (error) {
      logger.error('Error deleting knowledge item:', error);
      return false;
    }
  }
  
  /**
   * Delete all knowledge items for a bot
   */
  static async deleteAllForBot(botId: string): Promise<boolean> {
    try {
      await db.delete('knowledge_items', 'bot_id = ?', [botId]);
      return true;
    } catch (error) {
      logger.error('Error deleting all knowledge items for bot:', error);
      return false;
    }
  }
}