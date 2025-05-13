import { Tool } from "@discura/common";

import {
  toolRepository,
  ToolDefinitionEntity,
} from "../../services/database/tool.repository";
import { logger } from "../../utils/logger";

/**
 * Tool Definition DTO interface that matches the common package definition
 * This is used as a temporary interface until the type is properly generated in schema/types
 */
interface ToolDefinitionDto {
  id?: string;
  botId: string;
  name: string;
  description: string;
  schema: object;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  static async getByBotId(botId: string): Promise<ToolDefinitionDto[]> {
    try {
      const tools = await toolRepository.findByBotId(botId);
      return tools.map((tool) => this.mapToToolModel(tool));
    } catch (error) {
      logger.error(`Error in ToolAdapter.getByBotId(${botId}):`, error);
      throw error;
    }
  }

  /**
   * Get enabled tool definitions for a bot
   */
  static async getEnabledByBotId(botId: string): Promise<ToolDefinitionDto[]> {
    try {
      const tools = await toolRepository.findEnabledByBotId(botId);
      return tools.map((tool) => this.mapToToolModel(tool));
    } catch (error) {
      logger.error(`Error in ToolAdapter.getEnabledByBotId(${botId}):`, error);
      throw error;
    }
  }

  /**
   * Get a tool definition by ID
   */
  static async getById(id: number): Promise<ToolDefinitionDto | null> {
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
  static async getByNameAndBotId(
    name: string,
    botId: string,
  ): Promise<ToolDefinitionDto | null> {
    try {
      const tool = await toolRepository.findByNameAndBotId(name, botId);
      if (!tool) return null;

      return this.mapToToolModel(tool);
    } catch (error) {
      logger.error(
        `Error in ToolAdapter.getByNameAndBotId(${name}, ${botId}):`,
        error,
      );
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
  }): Promise<ToolDefinitionDto> {
    try {
      const { botId, name, description, schema, enabled = true } = data;

      // Check if tool with same name already exists
      const existingTool = await toolRepository.findByNameAndBotId(name, botId);
      if (existingTool) {
        throw new Error(
          `A tool with name "${name}" already exists for this bot`,
        );
      }

      const toolDefinition = await toolRepository.createToolDefinition({
        bot_id: botId,
        name,
        description,
        schema: JSON.stringify(schema),
        enabled: enabled ? 1 : 0,
      });

      return this.mapToToolModel(toolDefinition);
    } catch (error) {
      logger.error("Error in ToolAdapter.create:", error);
      throw error;
    }
  }

  /**
   * Update a tool definition
   */
  static async update(
    id: number,
    updates: Partial<Tool | ToolDefinitionDto>,
  ): Promise<boolean> {
    try {
      // Map API DTO to database entity format
      const entityUpdates: Partial<ToolDefinitionEntity> = {};

      if (updates.name !== undefined) entityUpdates.name = updates.name;
      if (updates.description !== undefined)
        entityUpdates.description = updates.description;

      if ("parameters" in updates || "implementation" in updates) {
        // Handle Tool type updates (from botConfiguration.ts)
        const schema = {
          parameters: "parameters" in updates ? updates.parameters : [],
          implementation:
            "implementation" in updates ? updates.implementation : "",
        };
        entityUpdates.schema = JSON.stringify(schema);
      } else if ("schema" in updates) {
        // Handle ToolDefinitionDto updates
        entityUpdates.schema = JSON.stringify(updates.schema);
      }

      if ("enabled" in updates) {
        entityUpdates.enabled = updates.enabled ? 1 : 0;
      }

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
  private static mapToToolModel(tool: ToolDefinitionEntity): ToolDefinitionDto {
    // Parse JSON schema string from database
    let parsedSchema: object = {};
    try {
      parsedSchema = JSON.parse(tool.schema);
    } catch (error) {
      logger.error(`Error parsing tool schema for tool ${tool.id}:`, error);
      parsedSchema = {};
    }

    return {
      id: tool.id?.toString(),
      botId: tool.bot_id,
      name: tool.name,
      description: tool.description,
      schema: parsedSchema,
      enabled: Boolean(tool.enabled),
      createdAt: tool.created_at,
      updatedAt: tool.updated_at,
    };
  }

  /**
   * Convert a tool definition to a Tool for bot configuration
   */
  static toTool(toolDefinition: ToolDefinitionDto): Tool {
    // Extract parameters and implementation from schema if possible
    let parameters = [];
    let implementation = "";

    if (
      typeof toolDefinition.schema === "object" &&
      toolDefinition.schema !== null
    ) {
      const schema = toolDefinition.schema as any;
      parameters = Array.isArray(schema.parameters) ? schema.parameters : [];
      implementation =
        typeof schema.implementation === "string" ? schema.implementation : "";
    }

    return {
      id: toolDefinition.id || "",
      name: toolDefinition.name,
      description: toolDefinition.description,
      parameters: parameters,
      implementation: implementation,
    };
  }
}
