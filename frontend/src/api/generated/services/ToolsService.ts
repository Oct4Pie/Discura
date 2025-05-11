/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateToolRequest } from '../models/CreateToolRequest';
import type { ToggleToolStatusRequest } from '../models/ToggleToolStatusRequest';
import type { ToolDefinitionDto } from '../models/ToolDefinitionDto';
import type { ToolDefinitionsResponseDto } from '../models/ToolDefinitionsResponseDto';
import type { UpdateToolRequest } from '../models/UpdateToolRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ToolsService {
    /**
     * Get all tool definitions for a bot
     * @param botId
     * @returns ToolDefinitionsResponseDto Ok
     * @throws ApiError
     */
    public static getToolsByBotId(
        botId: string,
    ): CancelablePromise<ToolDefinitionsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tools/{botId}',
            path: {
                'botId': botId,
            },
        });
    }
    /**
     * Get enabled tool definitions for a bot
     * @param botId
     * @returns ToolDefinitionsResponseDto Ok
     * @throws ApiError
     */
    public static getEnabledToolsByBotId(
        botId: string,
    ): CancelablePromise<ToolDefinitionsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tools/{botId}/enabled',
            path: {
                'botId': botId,
            },
        });
    }
    /**
     * Get tool definition by ID
     * @param id
     * @returns ToolDefinitionDto Ok
     * @throws ApiError
     */
    public static getToolById(
        id: number,
    ): CancelablePromise<ToolDefinitionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tools/detail/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create a new tool definition
     * @param requestBody
     * @returns ToolDefinitionDto Ok
     * @throws ApiError
     */
    public static createTool(
        requestBody: CreateToolRequest,
    ): CancelablePromise<ToolDefinitionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tools',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update a tool definition
     * @param id
     * @param requestBody
     * @returns ToolDefinitionDto Ok
     * @throws ApiError
     */
    public static updateTool(
        id: number,
        requestBody: UpdateToolRequest,
    ): CancelablePromise<ToolDefinitionDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/tools/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a tool definition
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteTool(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/tools/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Toggle tool enabled status
     * @param id
     * @param requestBody
     * @returns ToolDefinitionDto Ok
     * @throws ApiError
     */
    public static toggleToolStatus(
        id: number,
        requestBody: ToggleToolStatusRequest,
    ): CancelablePromise<ToolDefinitionDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/tools/{id}/toggle',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete all tool definitions for a bot
     * @param botId
     * @returns void
     * @throws ApiError
     */
    public static deleteAllToolsForBot(
        botId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/tools/bot/{botId}',
            path: {
                'botId': botId,
            },
        });
    }
}
