/**
 * Tool API Types
 *
 * This file contains all API types related to the Tool service.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

import { Tool, ToolParameter } from "./botConfiguration";

// Re-export Tool and ToolParameter from botConfiguration for backward compatibility
export { Tool, ToolParameter };

/**
 * Tool Definition DTO
 * @tsoaModel
 */
export interface ToolDefinitionDto {
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
 * Tool Definitions Response Data
 * @tsoaModel
 */
export interface ToolDefinitionsResponseDto {
  tools: ToolDefinitionDto[];
}

/**
 * Create Tool Request
 * @tsoaModel
 */
export interface CreateToolRequest {
  botId: string;
  name: string;
  description: string;
  schema: object;
  enabled?: boolean;
}

/**
 * Update Tool Request
 * @tsoaModel
 */
export interface UpdateToolRequest {
  name?: string;
  description?: string;
  schema?: object;
  enabled?: boolean;
}

/**
 * Toggle Tool Status Request
 * @tsoaModel
 */
export interface ToggleToolStatusRequest {
  enabled: boolean;
}
