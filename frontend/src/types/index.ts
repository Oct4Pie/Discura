/**
 * Frontend Type Definitions
 * 
 * This file re-exports types from the common package according to 
 * Discura Project Guidelines to maintain a single source of truth.
 */

// Re-export all common types
export * from '@discura/common';

// Re-export API-generated types with frontend-specific names for backward compatibility
// The Bot type is now just a direct alias to BotResponseDto in bot.ts
export type { Bot as FrontendBot } from './bot';
export { toBotModel, toBotModels, BotStatus } from './bot';

// User types - direct export instead of renaming to make consumption cleaner
export type { User } from './user';
export { toUserModel } from './user';

// Additional frontend-specific types can be defined here
// These are UI-specific types that don't represent shared business entities
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}