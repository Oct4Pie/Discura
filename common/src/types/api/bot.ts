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
  STARTING = "starting",
  STOPPING = "stopping",
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
  applicationId?: string; // Made optional since it can be provided by the backend
  intents?: string[];
  configuration?: BotConfiguration; // Changed from Record<string, any>
}

/**
 * Create Bot Request DTO
 * @tsoaModel
 */
export interface CreateBotRequestDto extends CreateBotRequest {}

/**
 * Create Bot Response DTO
 * @tsoaModel
 */
export interface CreateBotResponseDto extends BotResponseDto {}

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

/**
 * Update Bot Request DTO
 * @tsoaModel
 */
export interface UpdateBotRequestDto extends UpdateBotRequest {}

/**
 * Update Bot Response DTO
 * @tsoaModel
 */
export interface UpdateBotResponseDto extends BotResponseDto {}

/**
 * Get All Bots Response DTO
 * @tsoaModel
 */
export interface GetAllBotsResponseDto extends BotsResponseDto {}

/**
 * Get Bot Response DTO
 * @tsoaModel
 */
export interface GetBotResponseDto {
  bot: BotResponseDto;
}

/**
 * Start Bot Response DTO
 * @tsoaModel
 */
export interface StartBotResponseDto extends BotResponseDto {}

/**
 * Stop Bot Response DTO
 * @tsoaModel
 */
export interface StopBotResponseDto extends BotResponseDto {}

/**
 * Delete Bot Response DTO
 * @tsoaModel
 */
export interface DeleteBotResponseDto extends MessageResponseDto {}

/**
 * Message Response DTO
 * @tsoaModel
 */
export interface MessageResponseDto {
  message: string;
  success: boolean;
}

/**
 * Generate Bot Invite Link Response DTO
 * @tsoaModel
 */
export interface GenerateBotInviteLinkResponseDto {
  inviteUrl: string;
}

/**
 * Update Bot Configuration Request DTO
 * @tsoaModel
 */
export interface UpdateBotConfigurationRequestDto {
  configuration: BotConfiguration;
}

/**
 * Update Bot Configuration Response DTO
 * @tsoaModel
 */
export interface UpdateBotConfigurationResponseDto extends BotResponseDto {
  message: string;
}
