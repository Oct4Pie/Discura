import {
  ConstantsResponseDto,
  BotStatusConstants,
  LlmProviderConstants,
  ImageProviderConstants,
  DefaultsConstants,
  DiscordApiConstants,
} from "@discura/common";
import * as constants from "@discura/common/constants";
import { ConstantsController as CommonConstantsController } from "@discura/common/controllers";

import { logger } from "../utils/logger";

/**
 * Implementation of the ConstantsController for providing application constants
 */
export class ConstantsController extends CommonConstantsController {
  /**
   * Get all application constants
   */
  public async getConstants(): Promise<ConstantsResponseDto> {
    try {
      // Adapt constants to match the expected types
      // This ensures we maintain the contract defined in the common package's API types

      const botStatusConstants: BotStatusConstants = {
        OFFLINE: constants.BOT_STATUS.OFFLINE,
        ONLINE: constants.BOT_STATUS.ONLINE,
        ERROR: constants.BOT_STATUS.ERROR,
        LABELS: constants.BOT_STATUS.LABELS,
        COLORS: constants.BOT_STATUS.COLORS,
      };

      const llmProviderConstants: LlmProviderConstants = {
        OPENAI: constants.LLM_PROVIDER.OPENAI,
        ANTHROPIC: constants.LLM_PROVIDER.ANTHROPIC,
        GOOGLE: constants.LLM_PROVIDER.GOOGLE,
        GROQ: constants.LLM_PROVIDER.GROQ,
        COHERE: constants.LLM_PROVIDER.COHERE,
        DEEPSEEK: constants.LLM_PROVIDER.DEEPSEEK,
        MISTRAL: constants.LLM_PROVIDER.MISTRAL,
        AMAZON: constants.LLM_PROVIDER.AMAZON,
        AZURE: constants.LLM_PROVIDER.AZURE,
        FIREWORKS: constants.LLM_PROVIDER.FIREWORKS,
        TOGETHERAI: constants.LLM_PROVIDER.TOGETHERAI,
        PERPLEXITY: constants.LLM_PROVIDER.PERPLEXITY,
        DEEPINFRA: constants.LLM_PROVIDER.DEEPINFRA,
        XAI: constants.LLM_PROVIDER.XAI,
        OLLAMA: constants.LLM_PROVIDER.OLLAMA,
        HUGGINGFACE: constants.LLM_PROVIDER.HUGGINGFACE,
        CEREBRAS: constants.LLM_PROVIDER.CEREBRAS,
        ELEVENLABS: constants.LLM_PROVIDER.ELEVENLABS,
        GLADIA: constants.LLM_PROVIDER.GLADIA,
        ASSEMBLYAI: constants.LLM_PROVIDER.ASSEMBLYAI,
        REVAI: constants.LLM_PROVIDER.REVAI,
        DEEPGRAM: constants.LLM_PROVIDER.DEEPGRAM,
        LMNT: constants.LLM_PROVIDER.LMNT,
        HUME: constants.LLM_PROVIDER.HUME,
        OPENROUTER: constants.LLM_PROVIDER.OPENROUTER,
        CHUTES: constants.LLM_PROVIDER.CHUTES,
        CUSTOM: constants.LLM_PROVIDER.CUSTOM,
        LABELS: {
          openai: constants.LLM_PROVIDER.LABELS.openai,
          anthropic: constants.LLM_PROVIDER.LABELS.anthropic,
          google: constants.LLM_PROVIDER.LABELS.google,
          groq: constants.LLM_PROVIDER.LABELS.groq,
          cohere: constants.LLM_PROVIDER.LABELS.cohere,
          deepseek: constants.LLM_PROVIDER.LABELS.deepseek,
          mistral: constants.LLM_PROVIDER.LABELS.mistral,
          amazon: constants.LLM_PROVIDER.LABELS.amazon,
          azure: constants.LLM_PROVIDER.LABELS.azure,
          fireworks: constants.LLM_PROVIDER.LABELS.fireworks,
          togetherai: constants.LLM_PROVIDER.LABELS.togetherai,
          perplexity: constants.LLM_PROVIDER.LABELS.perplexity,
          deepinfra: constants.LLM_PROVIDER.LABELS.deepinfra,
          xai: constants.LLM_PROVIDER.LABELS.xai,
          ollama: constants.LLM_PROVIDER.LABELS.ollama,
          huggingface: constants.LLM_PROVIDER.LABELS.huggingface,
          cerebras: constants.LLM_PROVIDER.LABELS.cerebras,
          elevenlabs: constants.LLM_PROVIDER.LABELS.elevenlabs,
          gladia: constants.LLM_PROVIDER.LABELS.gladia,
          assemblyai: constants.LLM_PROVIDER.LABELS.assemblyai,
          revai: constants.LLM_PROVIDER.LABELS.revai,
          deepgram: constants.LLM_PROVIDER.LABELS.deepgram,
          lmnt: constants.LLM_PROVIDER.LABELS.lmnt,
          hume: constants.LLM_PROVIDER.LABELS.hume,
          chutes: constants.LLM_PROVIDER.LABELS.chutes,
          openrouter: constants.LLM_PROVIDER.LABELS.openrouter,
          custom: constants.LLM_PROVIDER.LABELS.custom,
        },
      };

      const imageProviderConstants: ImageProviderConstants = {
        OPENAI: constants.IMAGE_PROVIDER.OPENAI,
        STABILITY: constants.IMAGE_PROVIDER.STABILITY,
        MIDJOURNEY: constants.IMAGE_PROVIDER.MIDJOURNEY,
        LABELS: constants.IMAGE_PROVIDER.LABELS,
      };

      const defaultsConstants: DefaultsConstants = {
        BOT: {
          SYSTEM_PROMPT: constants.DEFAULTS.BOT.SYSTEM_PROMPT,
          PERSONALITY: constants.DEFAULTS.BOT.PERSONALITY,
          TRAITS: constants.DEFAULTS.BOT.TRAITS,
          LLM_PROVIDER: constants.DEFAULTS.BOT.LLM_PROVIDER,
          LLM_MODEL: constants.DEFAULTS.BOT.LLM_MODEL,
        },
      };

      const discordApiConstants: DiscordApiConstants = {
        BASE_URL: constants.DISCORD_API.BASE_URL,
        OAUTH2_URL: constants.DISCORD_API.OAUTH2_URL,
        PERMISSIONS: {
          SEND_MESSAGES: constants.DISCORD_API.PERMISSIONS.SEND_MESSAGES,
          VIEW_CHANNEL: constants.DISCORD_API.PERMISSIONS.VIEW_CHANNEL,
          READ_MESSAGE_HISTORY:
            constants.DISCORD_API.PERMISSIONS.READ_MESSAGE_HISTORY,
          ATTACH_FILES: constants.DISCORD_API.PERMISSIONS.ATTACH_FILES,
          EMBED_LINKS: constants.DISCORD_API.PERMISSIONS.EMBED_LINKS,
        },
        SCOPES: constants.DISCORD_API.SCOPES,
        PERMISSION_INTEGERS: constants.DISCORD_API.PERMISSION_INTEGERS,
      };

      logger.info("Retrieved application constants");

      return {
        constants: {
          BOT_STATUS: botStatusConstants,
          LLM_PROVIDER: llmProviderConstants,
          IMAGE_PROVIDER: imageProviderConstants,
          HTTP_STATUS: constants.HTTP_STATUS,
          STORAGE_KEYS: constants.STORAGE_KEYS,
          DEFAULTS: defaultsConstants,
          ENV_VARS: constants.ENV_VARS,
          DISCORD_API: discordApiConstants,
        },
      };
    } catch (error) {
      logger.error("Error in getConstants:", error);
      throw error;
    }
  }
}
