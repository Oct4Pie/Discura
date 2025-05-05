/**
 * Common Types
 * 
 * This is the main entry point for all shared type definitions
 * between frontend and backend.
 */

// Remove the import that's causing conflicts with enums
// import { BOT_STATUS, LLM_PROVIDER } from '../constants';

// Export domain types
export enum BotStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  ERROR = 'error'
}

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  CUSTOM = 'custom'
}

export enum ImageProvider {
  OPENAI = 'openai',
  STABILITY = 'stability',
  MIDJOURNEY = 'midjourney'
}

export interface User {
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  bots: string[]; // Reference to bot IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Bot {
  userId: string; // Owner ID
  name: string;
  discordToken: string;
  applicationId: string;
  status: BotStatus;
  intents: string[];
  configuration: BotConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotConfiguration {
  systemPrompt: string;
  personality: string;
  traits: string[];
  backstory: string;
  llmProvider: LLMProvider;
  llmModel: string;
  apiKey: string;
  knowledge: KnowledgeBase[];
  imageGeneration: ImageGenerationConfig;
  toolsEnabled: boolean;
  tools: Tool[];
}

export interface KnowledgeBase {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'file';
  source?: string;
}

export interface ImageGenerationConfig {
  enabled: boolean;
  provider: 'openai' | 'stability' | 'midjourney';
  apiKey?: string;
  model?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  implementation: string; // JavaScript code as string
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

// Import and export route constants
export * from './routes';

// Import types generated from the schema
import * as schemaTypes from '../schema/types';

// Export the common types
export * from './api'; // Assuming api.ts exports the necessary types

// Export the schema-generated types
export * from '../schema/types';

// Export constants for use throughout the application
export * from '../constants';

// Re-export constants with enum-compatible syntax for backwards compatibility
export { BOT_STATUS, LLM_PROVIDER, IMAGE_PROVIDER, STORAGE_KEYS, DEFAULTS } from '../constants';
