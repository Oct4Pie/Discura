import {
  LLMProvider,
  LLMModelsResponseDto,
  LLMCompletionRequestDto,
  LLMCompletionResponseDto,
  ProviderModelsResponseDto,
  AllProviderModelsResponseDto,
  CustomProviderConfig,
  LLMResponse,
} from "@discura/common";
import { LLMController as CommonLLMController } from "@discura/common/controllers";
import { Request } from "express";

import {
  listModels,
  getProviderModels,
  getAllProviderModels,
  refreshProviderModels,
  updateProviderStatus,
  configureCustomProvider,
  removeCustomProvider,
  createChatCompletion,
  callLLM,
} from "../services/llm.service";
import {
  getAiProviderRegistry,
  refreshAiProviderRegistry,
} from "../services/vercel-ai-sdk.service";
import { logger } from "../utils/logger";

/**
 * Implementation of the LLMController for managing LLM interactions
 */
export class LLMController extends CommonLLMController {
  /**
   * List available LLM models
   */
  public async getModels(): Promise<LLMModelsResponseDto> {
    try {
      const models = await listModels();

      logger.info("Retrieved available LLM models");

      return {
        object: "list",
        data: models,
      };
    } catch (error) {
      logger.error("Error in getModels:", error);
      throw error;
    }
  }

  /**
   * Create a chat completion using an LLM
   */
  public async createChatCompletion(
    requestBody: LLMCompletionRequestDto,
    request: Request,
  ): Promise<LLMCompletionResponseDto> {
    try {
      // Get user ID from authenticated request
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Use the service to create a chat completion
      return await createChatCompletion(requestBody, userId);
    } catch (error) {
      logger.error("Error in createChatCompletion:", error);
      throw error;
    }
  }

  /**
   * Get available LLM providers
   */
  public async getProviders(): Promise<{ providers: LLMProvider[] }> {
    try {
      // Return the providers from the LLMProvider enum
      // Make sure we only include providers that are actually in the enum
      return {
        providers: [
          LLMProvider.OPENAI,
          LLMProvider.ANTHROPIC,
          LLMProvider.GOOGLE,
          LLMProvider.GROQ,
          LLMProvider.COHERE,
          LLMProvider.DEEPSEEK,
          LLMProvider.MISTRAL,
          LLMProvider.AMAZON,
          LLMProvider.AZURE,
          LLMProvider.FIREWORKS,
          LLMProvider.TOGETHERAI,
          LLMProvider.PERPLEXITY,
          LLMProvider.DEEPINFRA,
          LLMProvider.XAI,
          LLMProvider.OLLAMA,
          LLMProvider.HUGGINGFACE,
          LLMProvider.CEREBRAS,
          LLMProvider.ELEVENLABS,
          LLMProvider.GLADIA,
          LLMProvider.ASSEMBLYAI,
          LLMProvider.REVAI,
          LLMProvider.DEEPGRAM,
          LLMProvider.LMNT,
          LLMProvider.HUME,
          LLMProvider.OPENROUTER,
          LLMProvider.CUSTOM,
        ],
      };
    } catch (error) {
      logger.error("Error in getProviders:", error);
      throw error;
    }
  }

  /**
   * Check if a specific provider is available
   */
  public async checkProviderAvailability(
    provider: LLMProvider,
  ): Promise<{ available: boolean }> {
    try {
      // Get provider registry to check if the provider is configured
      const registry = await getAiProviderRegistry();
      // This will check if the provider exists in the registry
      const available = !!registry[provider.toLowerCase()];

      logger.info(
        `Checked availability for provider ${provider}: ${available}`,
      );

      return { available };
    } catch (error) {
      logger.error(
        `Error in checkProviderAvailability for provider ${provider}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get models for a specific provider
   */
  public async getProviderModels(
    provider: LLMProvider,
  ): Promise<ProviderModelsResponseDto> {
    try {
      const result = await getProviderModels(provider);

      logger.info(`Retrieved models for provider ${provider}`);

      return result;
    } catch (error) {
      logger.error(
        `Error in getProviderModels for provider ${provider}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get models for all available providers
   */
  public async getAllProviderModels(): Promise<AllProviderModelsResponseDto> {
    try {
      const result = await getAllProviderModels();

      logger.info(`Retrieved models for all providers`);

      return result;
    } catch (error) {
      logger.error(`Error in getAllProviderModels:`, error);
      throw error;
    }
  }

  /**
   * Force refresh models for a provider
   */
  public async refreshProviderModels(
    provider: LLMProvider,
  ): Promise<ProviderModelsResponseDto> {
    try {
      const result = await refreshProviderModels(provider);

      logger.info(`Refreshed models for provider ${provider}`);

      return result;
    } catch (error) {
      logger.error(
        `Error in refreshProviderModels for provider ${provider}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Enable or disable a provider
   */
  public async updateProviderStatus(
    provider: LLMProvider,
    requestBody: { enabled: boolean },
  ): Promise<{ success: boolean; provider: LLMProvider; enabled: boolean }> {
    try {
      await updateProviderStatus(provider, requestBody.enabled);

      logger.info(
        `Updated provider ${provider} status to ${requestBody.enabled ? "enabled" : "disabled"}`,
      );

      return {
        success: true,
        provider,
        enabled: requestBody.enabled,
      };
    } catch (error) {
      logger.error(
        `Error in updateProviderStatus for provider ${provider}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Configure a custom provider
   */
  public async configureCustomProvider(
    requestBody: CustomProviderConfig,
  ): Promise<{ success: boolean; provider: CustomProviderConfig }> {
    try {
      await configureCustomProvider(requestBody);

      logger.info(`Configured custom provider: ${requestBody.name}`);

      return {
        success: true,
        provider: requestBody,
      };
    } catch (error) {
      logger.error(`Error in configureCustomProvider:`, error);
      throw error;
    }
  }

  /**
   * Remove a custom provider
   */
  public async removeCustomProvider(
    name: string,
  ): Promise<{ success: boolean; removed: boolean }> {
    try {
      const removed = await removeCustomProvider(name);

      logger.info(
        `Attempted to remove custom provider ${name}, success: ${removed}`,
      );

      return {
        success: true,
        removed,
      };
    } catch (error) {
      logger.error(`Error in removeCustomProvider for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get direct LLM response from a provider
   */
  public async getDirectLLMResponse(requestBody: {
    provider: LLMProvider;
    prompt: string;
    model?: string;
  }): Promise<LLMResponse> {
    try {
      const { provider, prompt, model } = requestBody;

      // Generate a random userId and botId for this direct call
      const userId = `direct-${Date.now()}`;
      const botId = `direct-${provider}-${Date.now()}`;

      // Call the LLM service
      const result = await callLLM({
        botId,
        userId,
        username: "DirectUser",
        prompt,
        model,
        provider,
      });

      logger.info(`Generated direct LLM response using ${provider}`);

      return result;
    } catch (error) {
      logger.error(`Error in getDirectLLMResponse:`, error);
      throw error;
    }
  }
}
