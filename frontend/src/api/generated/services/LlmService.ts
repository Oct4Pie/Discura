/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMCompletionRequestDto } from '../models/LLMCompletionRequestDto';
import type { LLMCompletionResponseDto } from '../models/LLMCompletionResponseDto';
import type { LLMModelsResponseDto } from '../models/LLMModelsResponseDto';
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
            url: '/api/llm/models',
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
            url: '/api/llm/chat/completions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
