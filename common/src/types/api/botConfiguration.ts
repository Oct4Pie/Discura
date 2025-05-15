/**
 * Image Provider Enum
 * @tsoaModel
 */
export enum ImageProvider {
  OPENAI = "openai",
  STABILITY = "stability",
  MIDJOURNEY = "midjourney",
  TOGETHER = "together",
  CHUTES_HIDREAM = "chutes_hidream",
}
import { LLMProvider } from "./llm";

/**
 * @tsoaModel
 */
export interface ImageGenerationConfig {
  enabled: boolean;
  provider: ImageProvider;
  apiKey?: string;
  model?: string | null;  // Updated to allow null values
}

/**
 * @tsoaModel
 */
export interface KnowledgeBase {
  id: string;
  name: string;
  content: string;
  type: "text" | "file";
  source?: string;
}

/**
 * @tsoaModel
 */
export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

/**
 * @tsoaModel
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  implementation: string; // JavaScript code as string
}

/**
 * Discord Activity Type Enum for bot presence
 * @tsoaModel
 */
export enum ActivityType {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  COMPETING = 5,
  CUSTOM = 4   // Using 4 as it's available in the Discord API Activity Types
}

/**
 * Bot Appearance Configuration
 * @tsoaModel
 */
export interface AppearanceConfig {
  avatarUrl?: string;
  presence?: {
    status?: "online" | "idle" | "dnd" | "invisible";
    activity?: {
      name: string;
      type: ActivityType;
      url?: string;
    };
  };
  colors?: {
    primary?: string;
    accent?: string;
  };
}

/**
 * Bot Configuration Structure
 * @tsoaModel
 */
export interface BotConfiguration {
  systemPrompt: string;
  personality: string;
  traits: string[];
  backstory: string;
  llmProvider: LLMProvider;
  llmModel: string;
  apiKey?: string;
  knowledge: KnowledgeBase[];
  imageGeneration: ImageGenerationConfig;
  toolsEnabled: boolean;
  tools: Tool[];
  appearance?: AppearanceConfig;
  visionModel: string;
  visionProvider: string;
}
