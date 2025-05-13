import { ToolController as CommonToolController } from "@discura/common/controllers";
import {
  ToolDefinitionDto,
  ToolDefinitionsResponseDto,
  CreateToolRequest,
  UpdateToolRequest,
  ToggleToolStatusRequest,
} from "@discura/common";
import { Request } from "express";

import { ToolAdapter } from "../models/adapters/tool.adapter";
import { logger } from "../utils/logger";

/**
 * Implementation of the ToolController for managing tool definitions
 */
export class ToolController extends CommonToolController {
  /**
   * Get all tool definitions for a bot
   */
  public async getToolsByBotId(
    botId: string,
  ): Promise<ToolDefinitionsResponseDto> {
    try {
      logger.info(`Fetching all tool definitions for bot ${botId}`);
      const tools = await ToolAdapter.getByBotId(botId);
      return { tools };
    } catch (error) {
      logger.error(`Error getting tool definitions for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Get enabled tool definitions for a bot
   */
  public async getEnabledToolsByBotId(
    botId: string,
  ): Promise<ToolDefinitionsResponseDto> {
    try {
      logger.info(`Fetching enabled tool definitions for bot ${botId}`);
      const tools = await ToolAdapter.getEnabledByBotId(botId);
      return { tools };
    } catch (error) {
      logger.error(
        `Error getting enabled tool definitions for bot ${botId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get tool definition by ID
   */
  public async getToolById(id: number): Promise<ToolDefinitionDto> {
    try {
      logger.info(`Fetching tool definition with ID ${id}`);
      const tool = await ToolAdapter.getById(id);

      if (!tool) {
        this.setStatus(404);
        throw new Error(`Tool definition with ID ${id} not found`);
      }

      return tool;
    } catch (error) {
      logger.error(`Error getting tool definition with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new tool definition
   */
  public async createTool(
    request: CreateToolRequest,
  ): Promise<ToolDefinitionDto> {
    try {
      logger.info(
        `Creating new tool definition for bot ${request.botId}: ${request.name}`,
      );
      return await ToolAdapter.create({
        botId: request.botId,
        name: request.name,
        description: request.description,
        schema: request.schema,
        enabled: request.enabled,
      });
    } catch (error) {
      logger.error(`Error creating tool definition:`, error);
      throw error;
    }
  }

  /**
   * Update a tool definition
   */
  public async updateTool(
    id: number,
    request: UpdateToolRequest,
  ): Promise<ToolDefinitionDto> {
    try {
      logger.info(`Updating tool definition with ID ${id}`);

      // Check if tool exists
      const tool = await ToolAdapter.getById(id);
      if (!tool) {
        this.setStatus(404);
        throw new Error(`Tool definition with ID ${id} not found`);
      }

      // Update tool
      const success = await ToolAdapter.update(id, request);
      if (!success) {
        throw new Error(`Failed to update tool definition with ID ${id}`);
      }

      // Return updated tool
      return (await ToolAdapter.getById(id)) as ToolDefinitionDto;
    } catch (error) {
      logger.error(`Error updating tool definition with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle tool enabled status
   */
  public async toggleToolStatus(
    id: number,
    request: ToggleToolStatusRequest,
  ): Promise<ToolDefinitionDto> {
    try {
      logger.info(
        `Toggling tool definition ${id} status to ${request.enabled ? "enabled" : "disabled"}`,
      );

      // Check if tool exists
      const tool = await ToolAdapter.getById(id);
      if (!tool) {
        this.setStatus(404);
        throw new Error(`Tool definition with ID ${id} not found`);
      }

      // Toggle status
      const success = await ToolAdapter.toggleEnabled(id, request.enabled);
      if (!success) {
        throw new Error(
          `Failed to toggle status of tool definition with ID ${id}`,
        );
      }

      // Return updated tool
      return (await ToolAdapter.getById(id)) as ToolDefinitionDto;
    } catch (error) {
      logger.error(`Error toggling tool definition ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Delete a tool definition
   */
  public async deleteTool(id: number): Promise<void> {
    try {
      logger.info(`Deleting tool definition with ID ${id}`);

      // Check if tool exists
      const tool = await ToolAdapter.getById(id);
      if (!tool) {
        this.setStatus(404);
        throw new Error(`Tool definition with ID ${id} not found`);
      }

      // Delete tool
      const success = await ToolAdapter.delete(id);
      if (!success) {
        throw new Error(`Failed to delete tool definition with ID ${id}`);
      }
    } catch (error) {
      logger.error(`Error deleting tool definition with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all tool definitions for a bot
   */
  public async deleteAllToolsForBot(botId: string): Promise<void> {
    try {
      logger.info(`Deleting all tool definitions for bot ${botId}`);
      await ToolAdapter.deleteAllForBot(botId);
    } catch (error) {
      logger.error(
        `Error deleting all tool definitions for bot ${botId}:`,
        error,
      );
      throw error;
    }
  }
}
