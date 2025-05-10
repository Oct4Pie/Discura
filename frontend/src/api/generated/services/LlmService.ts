/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMCompletionRequestDto } from '../models/LLMCompletionRequestDto';
import type { LLMCompletionResponseDto } from '../models/LLMCompletionResponseDto';
import type { LLMModelsResponseDto } from '../models/LLMModelsResponseDto';
import type { LLMProvider } from '../models/LLMProvider';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LlmService {
    /**
     * List available LLM models
     *
     * Returns a list of the available models sorted by creation date.
     * Models may vary based on system configuration and user permissions.
     * @returns LLMModelsResponseDto Ok
     * @throws ApiError
     */
    public static getModels(): CancelablePromise<LLMModelsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/undefined/models',
            errors: {
                500: `Server Error`,
            },
        });
    }
    /**
     * Create a chat completion
     *
     * Creates a completion for the chat message. This endpoint is compatible
     * with the OpenAI Chat API format but can work with multiple LLM providers.
     *
     * The completion includes choices which contain generated messages from the model.
     * Response format can be controlled by the request parameters.
     * @param requestBody
     * @returns LLMCompletionResponseDto Ok
     * @throws ApiError
     */
    public static createChatCompletion(
        requestBody: LLMCompletionRequestDto,
    ): CancelablePromise<LLMCompletionResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/undefined/chat/completions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid Request`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Get available LLM providers
     *
     * Returns the list of supported LLM providers in the system.
     * This helps clients know which providers are available.
     * @returns any Ok
     * @throws ApiError
     */
    public static getProviders(): CancelablePromise<{
        providers: Array<LLMProvider>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/undefined/providers',
            errors: {
                500: `Server Error`,
            },
        });
    }
    /**
     * Check if a specific provider is available
     *
     * Validates if the requested LLM provider is supported and available.
     * @param provider
     * @returns any Ok
     * @throws ApiError
     */
    public static checkProviderAvailability(
        provider: LLMProvider,
    ): CancelablePromise<{
        available: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/undefined/providers/{provider}',
            path: {
                'provider': provider,
            },
            errors: {
                404: `Provider Not Found`,
                500: `Server Error`,
            },
        });
    }
}
