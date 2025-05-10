/**
 * Frontend Type Definitions
 * 
 * This file re-exports types from the common package according to 
 * Discura Project Guidelines to maintain a single source of truth.
 */

// Export types from generated API
export * from '../api/generated';

// Re-export API-generated types with frontend-specific names for backward compatibility
// The Bot type is now just a direct alias to BotResponseDto in bot.ts
export type { Bot as FrontendBot } from './bot';
export { toBotModel, toBotModels, BotStatus } from './bot';

// User types - direct export instead of renaming to make consumption cleaner
export type { User } from './user';
export { toUserModel } from './user';

// Define custom types specific to frontend
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}