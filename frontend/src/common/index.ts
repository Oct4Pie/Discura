/**
 * Frontend Common Module
 * 
 * This file serves as a bridge between the frontend and the common package.
 * It re-exports all necessary types, constants, and utilities from the common package
 * to ensure proper path resolution within the frontend.
 */

// Re-export types, constants and routes from common package
export * from '../../../common/src/types';
export * from '../../../common/src/constants';
export * from '../../../common/src/types/routes';

// Re-export specific commonly used items for convenience
export { 
  BotStatus, 
  LLMProvider,
  ImageProvider,
  STORAGE_KEYS,
  BOT_STATUS,
  LLM_PROVIDER,
  IMAGE_PROVIDER,
  API_ROUTES 
} from '../../../common/src/types';