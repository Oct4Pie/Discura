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
        GROQ: constants.LLM_PROVIDER.GROQ || "groq",
        COHERE: constants.LLM_PROVIDER.COHERE || "cohere",
        DEEPSEEK: constants.LLM_PROVIDER.DEEPSEEK || "deepseek",
        MISTRAL: constants.LLM_PROVIDER.MISTRAL || "mistral",
        AMAZON: constants.LLM_PROVIDER.AMAZON || "amazon",
        AZURE: constants.LLM_PROVIDER.AZURE || "azure",
        FIREWORKS: constants.LLM_PROVIDER.FIREWORKS || "fireworks",
        TOGETHERAI: constants.LLM_PROVIDER.TOGETHERAI || "togetherai",
        PERPLEXITY: constants.LLM_PROVIDER.PERPLEXITY || "perplexity",
        DEEPINFRA: constants.LLM_PROVIDER.DEEPINFRA || "deepinfra",
        XAI: constants.LLM_PROVIDER.XAI || "xai",
        OLLAMA: constants.LLM_PROVIDER.OLLAMA || "ollama",
        HUGGINGFACE: constants.LLM_PROVIDER.HUGGINGFACE || "huggingface",
        CEREBRAS: constants.LLM_PROVIDER.CEREBRAS || "cerebras",
        ELEVENLABS: constants.LLM_PROVIDER.ELEVENLABS || "elevenlabs",
        GLADIA: constants.LLM_PROVIDER.GLADIA || "gladia",
        ASSEMBLYAI: constants.LLM_PROVIDER.ASSEMBLYAI || "assemblyai",
        REVAI: constants.LLM_PROVIDER.REVAI || "revai",
        DEEPGRAM: constants.LLM_PROVIDER.DEEPGRAM || "deepgram",
        LMNT: constants.LLM_PROVIDER.LMNT || "lmnt",
        HUME: constants.LLM_PROVIDER.HUME || "hume",
        OPENROUTER: constants.LLM_PROVIDER.OPENROUTER || "openrouter",
        CHUTES: constants.LLM_PROVIDER.CHUTES || "chutes", // Add missing CHUTES property
        CUSTOM: constants.LLM_PROVIDER.CUSTOM,
        LABELS: {
          openai: constants.LLM_PROVIDER.LABELS.openai,
          anthropic: constants.LLM_PROVIDER.LABELS.anthropic,
          google: constants.LLM_PROVIDER.LABELS.google || "Google AI",
          groq: constants.LLM_PROVIDER.LABELS.groq || "Groq",
          cohere: constants.LLM_PROVIDER.LABELS.cohere || "Cohere",
          deepseek: constants.LLM_PROVIDER.LABELS.deepseek || "DeepSeek",
          mistral: constants.LLM_PROVIDER.LABELS.mistral || "Mistral AI",
          amazon: constants.LLM_PROVIDER.LABELS.amazon || "Amazon Bedrock",
          azure: constants.LLM_PROVIDER.LABELS.azure || "Azure OpenAI",
          fireworks: constants.LLM_PROVIDER.LABELS.fireworks || "Fireworks AI",
          togetherai: constants.LLM_PROVIDER.LABELS.togetherai || "Together AI",
          perplexity: constants.LLM_PROVIDER.LABELS.perplexity || "Perplexity",
          deepinfra: constants.LLM_PROVIDER.LABELS.deepinfra || "DeepInfra",
          xai: constants.LLM_PROVIDER.LABELS.xai || "xAI Grok",
          ollama: constants.LLM_PROVIDER.LABELS.ollama || "Ollama",
          huggingface:
            constants.LLM_PROVIDER.LABELS.huggingface || "Hugging Face",
          cerebras: constants.LLM_PROVIDER.LABELS.cerebras || "Cerebras",
          elevenlabs: constants.LLM_PROVIDER.LABELS.elevenlabs || "ElevenLabs",
          gladia: constants.LLM_PROVIDER.LABELS.gladia || "Gladia",
          assemblyai: constants.LLM_PROVIDER.LABELS.assemblyai || "AssemblyAI",
          revai: constants.LLM_PROVIDER.LABELS.revai || "Rev.ai",
          deepgram: constants.LLM_PROVIDER.LABELS.deepgram || "Deepgram",
          lmnt: constants.LLM_PROVIDER.LABELS.lmnt || "LMNT",
          hume: constants.LLM_PROVIDER.LABELS.hume || "Hume",
          chutes: constants.LLM_PROVIDER.LABELS.chutes || "Chutes AI", // Add missing label for Chutes
          openrouter: constants.LLM_PROVIDER.LABELS.openrouter || "OpenRouter",
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
