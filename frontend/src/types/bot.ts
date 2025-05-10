/**
 * Bot type definitions for the frontend
 *
 * Following Discura Project Guidelines, we use types directly from the generated
 * API models and common package as the single source of truth.
 */

import { BotResponseDto } from "../api";
import { BotStatus } from "../api/";

// Re-export BotStatus for convenience
export { BotStatus };

/**
 * For frontend use, we directly use the API-generated BotResponseDto
 * This follows the single source of truth principle from the Discura Project Guidelines
 */
export type Bot = BotResponseDto;

/**
 * Helper function to convert a BotResponseDto to a strongly typed object
 * Ensures all required fields have values
 */
export function toBotModel(dto: BotResponseDto): Bot {
  return {
    ...dto,
    // Provide default values for optional API fields
    discordToken: dto.discordToken || "",
    // Note: We no longer need to cast configuration as we're using the API type directly
  };
}

/**
 * Helper function to convert multiple BotResponseDto objects to Bot objects
 */
export function toBotModels(dtos: BotResponseDto[]): Bot[] {
  return dtos.map(toBotModel);
}
