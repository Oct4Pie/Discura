import { logger } from '../utils/logger';
import {
  ConstantsResponseDto,
  BotStatusConstants,
  LlmProviderConstants,
  ImageProviderConstants,
  DefaultsConstants,
  DiscordApiConstants
} from '@discura/common/types';
import * as constants from '@discura/common/constants';
import { ConstantsController as CommonConstantsController } from '@discura/common/controllers';

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
        COLORS: constants.BOT_STATUS.COLORS
      };
      
      const llmProviderConstants: LlmProviderConstants = {
        OPENAI: constants.LLM_PROVIDER.OPENAI,
        ANTHROPIC: constants.LLM_PROVIDER.ANTHROPIC,
        GOOGLE: constants.LLM_PROVIDER.GOOGLE,
        CUSTOM: constants.LLM_PROVIDER.CUSTOM,
        LABELS: constants.LLM_PROVIDER.LABELS
      };
      
      const imageProviderConstants: ImageProviderConstants = {
        OPENAI: constants.IMAGE_PROVIDER.OPENAI,
        STABILITY: constants.IMAGE_PROVIDER.STABILITY,
        MIDJOURNEY: constants.IMAGE_PROVIDER.MIDJOURNEY,
        LABELS: constants.IMAGE_PROVIDER.LABELS
      };
      
      const defaultsConstants: DefaultsConstants = {
        BOT: {
          SYSTEM_PROMPT: constants.DEFAULTS.BOT.SYSTEM_PROMPT,
          PERSONALITY: constants.DEFAULTS.BOT.PERSONALITY,
          TRAITS: constants.DEFAULTS.BOT.TRAITS,
          LLM_PROVIDER: constants.DEFAULTS.BOT.LLM_PROVIDER,
          LLM_MODEL: constants.DEFAULTS.BOT.LLM_MODEL
        }
      };
      
      const discordApiConstants: DiscordApiConstants = {
        BASE_URL: constants.DISCORD_API.BASE_URL,
        OAUTH2_URL: constants.DISCORD_API.OAUTH2_URL,
        PERMISSIONS: {
          SEND_MESSAGES: constants.DISCORD_API.PERMISSIONS.SEND_MESSAGES,
          VIEW_CHANNEL: constants.DISCORD_API.PERMISSIONS.VIEW_CHANNEL,
          READ_MESSAGE_HISTORY: constants.DISCORD_API.PERMISSIONS.READ_MESSAGE_HISTORY,
          ATTACH_FILES: constants.DISCORD_API.PERMISSIONS.ATTACH_FILES,
          EMBED_LINKS: constants.DISCORD_API.PERMISSIONS.EMBED_LINKS
        },
        SCOPES: constants.DISCORD_API.SCOPES,
        PERMISSION_INTEGERS: constants.DISCORD_API.PERMISSION_INTEGERS
      };
      
      logger.info('Retrieved application constants');
      
      return {
        constants: {
          BOT_STATUS: botStatusConstants,
          LLM_PROVIDER: llmProviderConstants,
          IMAGE_PROVIDER: imageProviderConstants,
          HTTP_STATUS: constants.HTTP_STATUS,
          STORAGE_KEYS: constants.STORAGE_KEYS,
          DEFAULTS: defaultsConstants,
          ENV_VARS: constants.ENV_VARS,
          DISCORD_API: discordApiConstants
        }
      };
    } catch (error) {
      logger.error('Error in getConstants:', error);
      throw error;
    }
  }
}