/**
 * Common Types
 * 
 * This is the main entry point for all shared type definitions
 * between frontend and backend.
 */

// Re-export TSOA components to maintain single source of truth
export { Controller, Body, Get, Request, Post, Route, Security, Tags } from 'tsoa';

// Local enums that are not part of the API contract, if any, would go here.

export enum ImageProvider {
  OPENAI = 'openai',
  STABILITY = 'stability',
  MIDJOURNEY = 'midjourney'
}

// Import the types from schema/types (our single source of truth for API types)
// Forward export all API types from schema - IMPORTANT: This must come BEFORE using any types from it
export * from '../schema/types'; 

// Define User interface
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

// Define the Bot interface that depends on the BotStatus from schema
export interface Bot {
  userId: string; // Owner ID
  name: string;
  discordToken: string;
  applicationId: string;
  // Using string type instead of BotStatus enum to avoid circular dependency
  status: string; 
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
  // Use string literal type instead of LLMProvider enum to avoid circular dependency
  llmProvider: 'openai' | 'anthropic' | 'google' | 'custom';
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
// Explicitly export API_ROUTES to fix frontend import issue
export { API_ROUTES, ROUTES, CONTROLLER_ROUTES } from './routes';

// Export constants for use throughout the application
export * from '../constants';

// Re-export constants with enum-compatible syntax for backwards compatibility
export { BOT_STATUS, LLM_PROVIDER, IMAGE_PROVIDER, STORAGE_KEYS, DEFAULTS } from '../constants';
