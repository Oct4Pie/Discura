/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageGenerationConfig } from './ImageGenerationConfig';
import type { KnowledgeBase } from './KnowledgeBase';
import type { LLMProvider } from './LLMProvider';
import type { Tool } from './Tool';
/**
 * Placeholder interface for BotConfiguration
 * This will be replaced with the actual definition by sync-types.js
 */
export type BotConfiguration = {
    systemPrompt: string;
    personality: string;
    traits: Array<string>;
    backstory: string;
    llmProvider: LLMProvider;
    llmModel: string;
    apiKey: string;
    knowledge: Array<KnowledgeBase>;
    imageGeneration: ImageGenerationConfig;
    toolsEnabled: boolean;
    tools: Array<Tool>;
};

