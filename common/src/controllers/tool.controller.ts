import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Route,
  Security,
  Tags,
} from "tsoa";

import {
  ToolDefinitionDto,
  ToolDefinitionsResponseDto,
  CreateToolRequest,
  UpdateToolRequest,
  ToggleToolStatusRequest,
} from "../types/api";

/**
 * Tool controller
 * Handles tool definition operations
 */
@Route("tools")
@Tags("Tools")
export class ToolController extends Controller {
  /**
   * Get all tool definitions for a bot
   */
  @Get("{botId}")
  @Security("jwt")
  public async getToolsByBotId(
    @Path() botId: string,
  ): Promise<ToolDefinitionsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get enabled tool definitions for a bot
   */
  @Get("{botId}/enabled")
  @Security("jwt")
  public async getEnabledToolsByBotId(
    @Path() botId: string,
  ): Promise<ToolDefinitionsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get tool definition by ID
   */
  @Get("detail/{id}")
  @Security("jwt")
  public async getToolById(@Path() id: number): Promise<ToolDefinitionDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Create a new tool definition
   */
  @Post()
  @Security("jwt")
  public async createTool(
    @Body() request: CreateToolRequest,
  ): Promise<ToolDefinitionDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Update a tool definition
   */
  @Put("{id}")
  @Security("jwt")
  public async updateTool(
    @Path() id: number,
    @Body() request: UpdateToolRequest,
  ): Promise<ToolDefinitionDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Toggle tool enabled status
   */
  @Put("{id}/toggle")
  @Security("jwt")
  public async toggleToolStatus(
    @Path() id: number,
    @Body() request: ToggleToolStatusRequest,
  ): Promise<ToolDefinitionDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Delete a tool definition
   */
  @Delete("{id}")
  @Security("jwt")
  public async deleteTool(@Path() id: number): Promise<void> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Delete all tool definitions for a bot
   */
  @Delete("bot/{botId}")
  @Security("jwt")
  public async deleteAllToolsForBot(@Path() botId: string): Promise<void> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }
}
