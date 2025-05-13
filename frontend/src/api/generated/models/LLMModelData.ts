/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModelCapabilities } from './ModelCapabilities';
import type { ModelPricing } from './ModelPricing';
/**
 * LLM Model Data Structure
 */
export type LLMModelData = {
    id: string;
    object: string;
    created: number;
    owned_by: string;
    display_name: string;
    provider_model_id: string;
    capabilities?: ModelCapabilities;
    context_length?: number;
    pricing?: ModelPricing;
    max_tokens?: number;
};

