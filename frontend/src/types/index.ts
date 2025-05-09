/**
 * Frontend Type Definitions
 * 
 * This file defines and exports types used throughout the frontend application.
 * We import shared types from the common package to maintain a single source of truth.
 */

import { components } from '../api/schema';
import { BotStatus } from '../api/generated/models/BotStatus';


export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PROFILE: 'user_profile'
} as const;

// Export BotStatus from the generated API
export { BotStatus };

// Alias Bot to BotResponseDto from the OpenAPI schema
export type Bot = components['schemas']['BotResponseDto'];

// Alias User to UserResponseDto from the OpenAPI schema
export type User = components['schemas']['UserResponseDto'];

// Other frontend-specific types
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}