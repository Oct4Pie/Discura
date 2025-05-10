/**
 * Bot API Types
 *
 * This file contains all API types related to the Bot service.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

import { BotConfiguration } from "./botConfiguration";

/**
 * Bot Status Enum
 * @tsoaModel
 */
export enum BotStatus {
  OFFLINE = "offline",
  ONLINE = "online",
  ERROR = "error",
}

/**
 * Bot Response Data
 * @tsoaModel
 */
export interface BotResponseDto {
  id: string;
  userId: string;
  name: string;
  discordToken?: string;
  applicationId: string;
  status: BotStatus;
  intents: string[];
  configuration: BotConfiguration; // Changed from Record<string, any>
  createdAt: string;
  updatedAt: string;
}

/**
 * Bots Response Data
 * @tsoaModel
 */
export interface BotsResponseDto {
  bots: BotResponseDto[];
}

/**
 * Create Bot Request
 * @tsoaModel
 */
export interface CreateBotRequest {
  name: string;
  discordToken: string;
  applicationId: string;
  intents?: string[];
  configuration?: BotConfiguration; // Changed from Record<string, any>
}

/**
 * Update Bot Request
 * @tsoaModel
 */
export interface UpdateBotRequest {
  name?: string;
  discordToken?: string;
  applicationId?: string;
  intents?: string[];
  status?: BotStatus;
  configuration?: BotConfiguration; // Changed from Record<string, any>
}
