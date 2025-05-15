/**
 * Bot configuration validation utilities
 *
 * This file contains functions for validating bot configuration objects
 * before they are saved to the database or used to initialize a bot.
 */

import { BotConfiguration, LLMProvider, ImageProvider } from "@discura/common";

import { logger } from "./logger";

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Verify that a bot configuration is valid
 * @param config Bot configuration object to validate
 * @returns Validation result with errors if any
 */
export function verifyBotConfig(config: any): ValidationResult {
  const errors: string[] = [];

  // Check if configuration is provided
  if (!config) {
    return { valid: false, errors: ["Configuration is required"] };
  }

  // Validate LLM configuration
  if (config.llmProvider) {
    // Verify provider is a valid enum value
    const validProviders = Object.values(LLMProvider);
    if (!validProviders.includes(config.llmProvider)) {
      errors.push(`Invalid LLM provider: ${config.llmProvider}`);
    }

    // Check if model is specified
    if (!config.llmModel) {
      errors.push("LLM model must be specified");
    }

    // Note: API keys are managed through environment variables in the format ${PROVIDER}_KEY
    // and should not be included in the bot configuration
  } else {
    errors.push("LLM provider is required");
  }

  // Validate image generation configuration if enabled
  if (config.imageGeneration?.enabled) {
    const validImageProviders = Object.values(ImageProvider);

    if (!config.imageGeneration.provider) {
      errors.push(
        "Image provider must be specified when image generation is enabled",
      );
    } else if (!validImageProviders.includes(config.imageGeneration.provider)) {
      errors.push(`Invalid image provider: ${config.imageGeneration.provider}`);
    }

    // Note: Image provider API keys are also managed through environment variables
    // and should not be included in the bot configuration
  }

  // Validate system prompt length if provided
  if (config.systemPrompt) {
    const maxSystemPromptLength = 4000; // Arbitrary limit to prevent abuse
    if (config.systemPrompt.length > maxSystemPromptLength) {
      errors.push(
        `System prompt exceeds maximum length of ${maxSystemPromptLength} characters`,
      );
    }
  }

  // Validate tool configuration if tools are enabled
  if (config.toolsEnabled) {
    if (!Array.isArray(config.tools)) {
      errors.push("Tools array is required when tools are enabled");
    } else {
      // Check each tool configuration
      config.tools.forEach((tool: any, index: number) => {
        if (!tool.id) errors.push(`Tool at index ${index} is missing an ID`);
        if (!tool.name) errors.push(`Tool at index ${index} is missing a name`);
        if (!tool.description)
          errors.push(`Tool at index ${index} is missing a description`);

        // Validate parameters
        if (!Array.isArray(tool.parameters)) {
          errors.push(
            `Tool "${tool.name || index}" is missing parameters array`,
          );
        }

        // Validate implementation
        if (!tool.implementation) {
          errors.push(`Tool "${tool.name || index}" is missing implementation`);
        } else if (typeof tool.implementation !== "string") {
          errors.push(
            `Tool "${tool.name || index}" implementation must be a string`,
          );
        }
      });
    }
  }

  // Log validation results
  if (errors.length > 0) {
    logger.warn(
      `Bot configuration validation failed with ${errors.length} errors:`,
      errors,
    );
  } else {
    logger.debug("Bot configuration validation passed");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
