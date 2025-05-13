/**
 * Image Provider Enum
 * @tsoaModel
 */
export enum ImageProvider {
  OPENAI = "openai",
  STABILITY = "stability",
  MIDJOURNEY = "midjourney",
}

// Import LLMProvider from llm.ts instead of duplicating it
import { LLMProvider } from "./llm";

/**
 * @tsoaModel
 */
export interface ImageGenerationConfig {
  enabled: boolean;
  provider: ImageProvider;
  apiKey?: string;
  model?: string;
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
  apiKey: string; // Assuming this is the LLM API Key
  knowledge: KnowledgeBase[];
  imageGeneration: ImageGenerationConfig;
  toolsEnabled: boolean;
  tools: Tool[];
}
