/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMModelData } from './LLMModelData';
import type { LLMProvider } from './LLMProvider';
/**
 * Provider Models Response - Contains models available for a specific
 * provider
 */
export type ProviderModelsResponseDto = {
    provider: LLMProvider;
    provider_display_name: string;
    models: Array<LLMModelData>;
    last_updated: number;
};

