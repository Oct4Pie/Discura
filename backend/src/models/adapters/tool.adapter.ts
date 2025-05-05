import { toolRepository, ToolDefinitionEntity } from '../../services/database/tool.repository';
import { logger } from '../../utils/logger';

/**
 * Tool definition DTO for API responses
 */
export interface ToolDefinitionDto {
  id?: string;
  botId: string;
  name: string;
  description: string;
  schema: object;
  enabled: boolean;
}

/**
 * ToolAdapter - Provides a consistent interface for tool definitions in SQLite
 * 
 * This adapter maintains a consistent interface for tool definition operations
 * using the SQLite repository.
 */
export class ToolAdapter {
  /**
   * Get all tool definitions for a bot
   */
  static async getByBotId(botId: string): Promise<any[]> {
    try {
      const tools = await toolRepository.findByBotId(botId);
      return tools.map(tool => this.mapToToolModel(tool));
    } catch (error) {
      logger.error(`Error in ToolAdapter.getByBotId(${botId}):`, error);
      throw error;
    }
  }

  /**
   * Get enabled tool definitions for a bot
   */
  static async getEnabledByBotId(botId: string): Promise<any[]> {
    try {
      const tools = await toolRepository.findEnabledByBotId(botId);
      return tools.map(tool => this.mapToToolModel(tool));
    } catch (error) {
      logger.error(`Error in ToolAdapter.getEnabledByBotId(${botId}):`, error);
      throw error;
    }
  }

  /**
   * Get a tool definition by ID
   */
  static async getById(id: number): Promise<any> {
    try {
      const tool = await toolRepository.findToolById(id);
      if (!tool) return null;
      
      return this.mapToToolModel(tool);
    } catch (error) {
      logger.error(`Error in ToolAdapter.getById(${id}):`, error);
      throw error;
    }
  }

  /**
   * Get a tool definition by name and bot ID
   */
  static async getByNameAndBotId(name: string, botId: string): Promise<any> {
    try {
      const tool = await toolRepository.findByNameAndBotId(name, botId);
      if (!tool) return null;
      
      return this.mapToToolModel(tool);
    } catch (error) {
      logger.error(`Error in ToolAdapter.getByNameAndBotId(${name}, ${botId}):`, error);
      throw error;
    }
  }

  /**
   * Create a new tool definition
   */
  static async create(data: {
    botId: string;
    name: string;
    description: string;
    schema: object;
    enabled?: boolean;
  }): Promise<any> {
    try {
      const { botId, name, description, schema, enabled = true } = data;
      
      // Check if tool with same name already exists
      const existingTool = await toolRepository.findByNameAndBotId(name, botId);
      if (existingTool) {
        throw new Error(`A tool with name "${name}" already exists for this bot`);
      }
      
      const toolDefinition = await toolRepository.createToolDefinition({
        bot_id: botId,
        name,
        description,
        schema: JSON.stringify(schema),
        enabled: enabled ? 1 : 0
      });
      
      return this.mapToToolModel(toolDefinition);
    } catch (error) {
      logger.error('Error in ToolAdapter.create:', error);
      throw error;
    }
  }

  /**
   * Update a tool definition
   */
  static async update(id: number, updates: Partial<ToolDefinitionDto>): Promise<boolean> {
    try {
      // Map API DTO to database entity format
      const entityUpdates: Partial<ToolDefinitionEntity> = {};
      
      if (updates.name !== undefined) entityUpdates.name = updates.name;
      if (updates.description !== undefined) entityUpdates.description = updates.description;
      if (updates.schema !== undefined) entityUpdates.schema = JSON.stringify(updates.schema);
      if (updates.enabled !== undefined) entityUpdates.enabled = updates.enabled ? 1 : 0;
      
      return await toolRepository.updateToolDefinition(id, entityUpdates);
    } catch (error) {
      logger.error(`Error in ToolAdapter.update(${id}):`, error);
      throw error;
    }
  }

  /**
   * Toggle the enabled status of a tool
   */
  static async toggleEnabled(id: number, enabled: boolean): Promise<boolean> {
    try {
      return await toolRepository.toggleEnabled(id, enabled);
    } catch (error) {
      logger.error(`Error in ToolAdapter.toggleEnabled(${id}):`, error);
      throw error;
    }
  }

  /**
   * Delete a tool definition
   */
  static async delete(id: number): Promise<boolean> {
    try {
      return await toolRepository.deleteToolDefinition(id);
    } catch (error) {
      logger.error(`Error in ToolAdapter.delete(${id}):`, error);
      throw error;
    }
  }

  /**
   * Delete all tool definitions for a bot
   */
  static async deleteAllForBot(botId: string): Promise<boolean> {
    try {
      return await toolRepository.deleteAllForBot(botId);
    } catch (error) {
      logger.error(`Error in ToolAdapter.deleteAllForBot(${botId}):`, error);
      throw error;
    }
  }

  /**
   * Map SQLite entity to tool model format
   */
  private static mapToToolModel(tool: ToolDefinitionEntity): any {
    // Parse JSON schema string from database
    let parsedSchema: object;
    try {
      parsedSchema = JSON.parse(tool.schema);
    } catch (error) {
      logger.error(`Error parsing tool schema for tool ${tool.id}:`, error);
      parsedSchema = {};
    }
    
    return {
      id: tool.id,
      botId: tool.bot_id,
      name: tool.name,
      description: tool.description,
      schema: parsedSchema,
      enabled: Boolean(tool.enabled),
      createdAt: tool.created_at ? new Date(tool.created_at) : new Date(),
      updatedAt: tool.updated_at ? new Date(tool.updated_at) : new Date(),
      
      // Add helper methods for consistent interface
      lean: function() {
        return { ...this };
      },
      
      // Convert to ToolDefinitionDto
      toDTO: function(): ToolDefinitionDto {
        return {
          id: this.id?.toString(),
          botId: this.botId,
          name: this.name,
          description: this.description,
          schema: this.schema,
          enabled: this.enabled
        };
      }
    };
  }
}