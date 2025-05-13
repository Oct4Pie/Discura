/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllProviderModelsResponseDto } from '../models/AllProviderModelsResponseDto';
import type { CustomProviderConfig } from '../models/CustomProviderConfig';
import type { LLMCompletionRequestDto } from '../models/LLMCompletionRequestDto';
import type { LLMCompletionResponseDto } from '../models/LLMCompletionResponseDto';
import type { LLMModelsResponseDto } from '../models/LLMModelsResponseDto';
import type { LLMProvider } from '../models/LLMProvider';
import type { ProviderModelsResponseDto } from '../models/ProviderModelsResponseDto';
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
            url: '/llm/models',
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
            url: '/llm/chat/completions',
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
            url: '/llm/providers',
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
            url: '/llm/providers/{provider}',
            path: {
                'provider': provider,
            },
            errors: {
                404: `Provider Not Found`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Get models for a specific provider
     *
     * Returns the models available for the specified provider.
     * Results are cached to avoid rate limiting but will be refreshed
     * if the cache is too old.
     * @param provider
     * @returns ProviderModelsResponseDto Ok
     * @throws ApiError
     */
    public static getProviderModels(
        provider: LLMProvider,
    ): CancelablePromise<ProviderModelsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/llm/providers/{provider}/models',
            path: {
                'provider': provider,
            },
            errors: {
                404: `Provider Not Found`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Get models for all available providers
     *
     * Returns models available for all providers in the system.
     * Results are cached to avoid rate limiting but will be refreshed
     * if the cache is too old.
     * @returns AllProviderModelsResponseDto Ok
     * @throws ApiError
     */
    public static getAllProviderModels(): CancelablePromise<AllProviderModelsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/llm/models/all-providers',
            errors: {
                500: `Server Error`,
            },
        });
    }
    /**
     * Force refresh models for a provider
     *
     * Forces a refresh of the model cache for the specified provider.
     * This will make a new API call to the provider to get the latest models.
     * @param provider
     * @returns ProviderModelsResponseDto Ok
     * @throws ApiError
     */
    public static refreshProviderModels(
        provider: LLMProvider,
    ): CancelablePromise<ProviderModelsResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/llm/providers/{provider}/models/refresh',
            path: {
                'provider': provider,
            },
            errors: {
                404: `Provider Not Found`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Enable or disable a provider
     *
     * Updates the status of a provider to either enabled or disabled.
     * Providers must be enabled to be used in the system.
     * @param provider
     * @param requestBody
     * @returns any Ok
     * @throws ApiError
     */
    public static updateProviderStatus(
        provider: LLMProvider,
        requestBody: {
            enabled: boolean;
        },
    ): CancelablePromise<{
        enabled: boolean;
        provider: LLMProvider;
        success: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/llm/providers/{provider}/status',
            path: {
                'provider': provider,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Provider Not Found`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Configure a custom provider
     *
     * Adds or updates a custom provider configuration.
     * Custom providers must follow the OpenAI-compatible API format.
     * @param requestBody
     * @returns any Ok
     * @throws ApiError
     */
    public static configureCustomProvider(
        requestBody: CustomProviderConfig,
    ): CancelablePromise<{
        provider: CustomProviderConfig;
        success: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/llm/providers/custom',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid Provider Configuration`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Remove a custom provider
     *
     * Removes a custom provider from the system by name.
     * @param name
     * @returns any Ok
     * @throws ApiError
     */
    public static removeCustomProvider(
        name: string,
    ): CancelablePromise<{
        removed: boolean;
        success: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/llm/providers/custom/{name}',
            path: {
                'name': name,
            },
            errors: {
                404: `Provider Not Found`,
                500: `Server Error`,
            },
        });
    }
}
