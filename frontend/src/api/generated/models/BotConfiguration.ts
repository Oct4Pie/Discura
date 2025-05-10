/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageGenerationConfig } from './ImageGenerationConfig';
import type { KnowledgeBase } from './KnowledgeBase';
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
    llmProvider: BotConfiguration.llmProvider;
    llmModel: string;
    apiKey: string;
    knowledge: Array<KnowledgeBase>;
    imageGeneration: ImageGenerationConfig;
    toolsEnabled: boolean;
    tools: Array<Tool>;
};
export namespace BotConfiguration {
    export enum llmProvider {
        OPENAI = 'openai',
        ANTHROPIC = 'anthropic',
        GOOGLE = 'google',
        CUSTOM = 'custom',
    }
}

