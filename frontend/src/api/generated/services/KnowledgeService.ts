/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KnowledgeBaseResponseDto } from '../models/KnowledgeBaseResponseDto';
import type { KnowledgeItemDto } from '../models/KnowledgeItemDto';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class KnowledgeService {
    /**
     * Get all knowledge items for a specific bot
     * @param botId The unique identifier of the bot
     * @returns KnowledgeBaseResponseDto Ok
     * @throws ApiError
     */
    public static getKnowledgeItems(
        botId: string,
    ): CancelablePromise<KnowledgeBaseResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bots/{botId}/knowledge',
            path: {
                'botId': botId,
            },
        });
    }
    /**
     * Add a new knowledge item to a bot
     * @param botId The unique identifier of the bot
     * @param requestBody
     * @returns KnowledgeItemDto Ok
     * @throws ApiError
     */
    public static addKnowledgeItem(
        botId: string,
        requestBody: {
            priority?: number;
            type: string;
            content: string;
            title: string;
        },
    ): CancelablePromise<KnowledgeItemDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bots/{botId}/knowledge',
            path: {
                'botId': botId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update a knowledge item
     * @param botId The unique identifier of the bot
     * @param itemId The unique identifier of the knowledge item
     * @param requestBody
     * @returns KnowledgeItemDto Ok
     * @throws ApiError
     */
    public static updateKnowledgeItem(
        botId: string,
        itemId: string,
        requestBody: {
            priority?: number;
            type?: string;
            content?: string;
            title?: string;
        },
    ): CancelablePromise<KnowledgeItemDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/bots/{botId}/knowledge/{itemId}',
            path: {
                'botId': botId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a knowledge item
     * @param botId The unique identifier of the bot
     * @param itemId The unique identifier of the knowledge item
     * @returns MessageResponseDto Ok
     * @throws ApiError
     */
    public static deleteKnowledgeItem(
        botId: string,
        itemId: string,
    ): CancelablePromise<MessageResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/bots/{botId}/knowledge/{itemId}',
            path: {
                'botId': botId,
                'itemId': itemId,
            },
        });
    }
}
