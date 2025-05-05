/**
 * Common Types
 *
 * This is the main entry point for all shared type definitions
 * between frontend and backend.
 */
export declare enum BotStatus {
    OFFLINE = "offline",
    ONLINE = "online",
    ERROR = "error"
}
export declare enum LLMProvider {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    GOOGLE = "google",
    CUSTOM = "custom"
}
export interface User {
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
    bots: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Bot {
    userId: string;
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
    implementation: string;
}
export interface ToolParameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
}
export * from './api';
export * from '../schema/types';
//# sourceMappingURL=index.d.ts.map