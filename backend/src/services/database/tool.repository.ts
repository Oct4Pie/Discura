import { BaseRepository } from './base.repository';
import { db } from './database.factory';
import { logger } from '../../utils/logger';

/**
 * Tool definition entity representing a row in the tool_definitions table
 */
export interface ToolDefinitionEntity {
  id?: number;
  bot_id: string;
  name: string;
  description: string;
  schema: string; // JSON schema stored as string
  enabled: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * ToolRepository - Manages tool definition data operations
 */
export class ToolRepository extends BaseRepository<ToolDefinitionEntity> {
  private static instance: ToolRepository;

  private constructor() {
    super('tool_definitions');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ToolRepository {
    if (!ToolRepository.instance) {
      ToolRepository.instance = new ToolRepository();
    }
    return ToolRepository.instance;
  }

  /**
   * Find tool definitions by bot ID
   */
  async findByBotId(botId: string): Promise<ToolDefinitionEntity[]> {
    try {
      return await this.findByField('bot_id', botId);
    } catch (error) {
      logger.error(`Error fetching tool definitions for bot ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Find enabled tool definitions by bot ID
   */
  async findEnabledByBotId(botId: string): Promise<ToolDefinitionEntity[]> {
    try {
      return await db.query<ToolDefinitionEntity>(
        'SELECT * FROM tool_definitions WHERE bot_id = ? AND enabled = 1',
        [botId]
      );
    } catch (error) {
      logger.error(`Error fetching enabled tool definitions for bot ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Find tool definition by ID
   */
  async findToolById(id: number): Promise<ToolDefinitionEntity | null> {
    try {
      return await db.get<ToolDefinitionEntity>(
        'SELECT * FROM tool_definitions WHERE id = ?',
        [id]
      );
    } catch (error) {
      logger.error(`Error fetching tool definition with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find tool definition by name and bot ID
   */
  async findByNameAndBotId(name: string, botId: string): Promise<ToolDefinitionEntity | null> {
    try {
      return await db.get<ToolDefinitionEntity>(
        'SELECT * FROM tool_definitions WHERE name = ? AND bot_id = ?',
        [name, botId]
      );
    } catch (error) {
      logger.error(`Error fetching tool definition ${name} for bot ID ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new tool definition
   */
  async createToolDefinition(tool: Omit<ToolDefinitionEntity, 'id' | 'created_at' | 'updated_at'>): Promise<ToolDefinitionEntity> {
    try {
      const now = new Date().toISOString();
      const toolDefinition: ToolDefinitionEntity = {
        ...tool,
        created_at: now,
        updated_at: now
      };

      const id = await this.create(toolDefinition);
      return {
        ...toolDefinition,
        id: id as number
      };
    } catch (error) {
      logger.error('Error creating tool definition:', error);
      throw error;
    }
  }

  /**
   * Update a tool definition
   */
  async updateToolDefinition(id: number, updates: Partial<ToolDefinitionEntity>): Promise<boolean> {
    try {
      const updatedTool = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Delete any id field from updates to prevent overwriting the primary key
      delete updatedTool.id;
      
      return await db.update(
        this.tableName,
        updatedTool,
        'id = ?',
        [id]
      ) > 0;
    } catch (error) {
      logger.error(`Error updating tool definition ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle tool enabled status
   */
  async toggleEnabled(id: number, enabled: boolean): Promise<boolean> {
    try {
      return await this.updateToolDefinition(id, { 
        enabled: enabled ? 1 : 0 
      });
    } catch (error) {
      logger.error(`Error toggling tool definition ${id} enabled status:`, error);
      throw error;
    }
  }

  /**
   * Delete a tool definition
   */
  async deleteToolDefinition(id: number): Promise<boolean> {
    try {
      return await db.delete(this.tableName, 'id = ?', [id]) > 0;
    } catch (error) {
      logger.error(`Error deleting tool definition ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all tool definitions for a bot
   */
  async deleteAllForBot(botId: string): Promise<boolean> {
    try {
      return await db.delete(this.tableName, 'bot_id = ?', [botId]) > 0;
    } catch (error) {
      logger.error(`Error deleting all tool definitions for bot ${botId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const toolRepository = ToolRepository.getInstance();