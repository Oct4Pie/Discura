/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateBotRequestDto } from '../models/CreateBotRequestDto';
import type { CreateBotResponseDto } from '../models/CreateBotResponseDto';
import type { DeleteBotResponseDto } from '../models/DeleteBotResponseDto';
import type { GenerateBotInviteLinkResponseDto } from '../models/GenerateBotInviteLinkResponseDto';
import type { GetAllBotsResponseDto } from '../models/GetAllBotsResponseDto';
import type { GetBotResponseDto } from '../models/GetBotResponseDto';
import type { StartBotResponseDto } from '../models/StartBotResponseDto';
import type { StopBotResponseDto } from '../models/StopBotResponseDto';
import type { UpdateBotConfigurationRequestDto } from '../models/UpdateBotConfigurationRequestDto';
import type { UpdateBotConfigurationResponseDto } from '../models/UpdateBotConfigurationResponseDto';
import type { UpdateBotRequestDto } from '../models/UpdateBotRequestDto';
import type { UpdateBotResponseDto } from '../models/UpdateBotResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BotsService {
    /**
     * List all bots for the authenticated user
     *
     * Returns a list of Discord bots owned by the authenticated user,
     * including their configuration and status.
     * @returns GetAllBotsResponseDto Ok
     * @throws ApiError
     */
    public static getUserBots(): CancelablePromise<GetAllBotsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bots',
        });
    }
    /**
     * Create a new bot
     *
     * Creates a new Discord bot with the specified configuration.
     * The bot will be owned by the authenticated user.
     * @param requestBody
     * @returns CreateBotResponseDto Bot created successfully
     * @throws ApiError
     */
    public static createBot(
        requestBody: CreateBotRequestDto,
    ): CancelablePromise<CreateBotResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bots',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get a specific bot by ID
     *
     * Returns detailed information about a specific bot owned by the authenticated user.
     * @param id The unique identifier of the bot
     * @returns GetBotResponseDto Ok
     * @throws ApiError
     */
    public static getBotById(
        id: string,
    ): CancelablePromise<GetBotResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bots/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing bot
     *
     * Updates the configuration of an existing bot owned by the authenticated user.
     * @param id The unique identifier of the bot to update
     * @param requestBody
     * @returns UpdateBotResponseDto Ok
     * @throws ApiError
     */
    public static updateBot(
        id: string,
        requestBody: UpdateBotRequestDto,
    ): CancelablePromise<UpdateBotResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/bots/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a bot
     *
     * Deletes a bot owned by the authenticated user.
     * If the bot is currently running, it will be stopped before deletion.
     * @param id The unique identifier of the bot to delete
     * @returns DeleteBotResponseDto Ok
     * @throws ApiError
     */
    public static deleteBot(
        id: string,
    ): CancelablePromise<DeleteBotResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/bots/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Start a bot
     *
     * Starts a Discord bot that is currently stopped.
     * @param id The unique identifier of the bot to start
     * @returns StartBotResponseDto Ok
     * @throws ApiError
     */
    public static startBotById(
        id: string,
    ): CancelablePromise<StartBotResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bots/{id}/start',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Stop a bot
     *
     * Stops a Discord bot that is currently running.
     * @param id The unique identifier of the bot to stop
     * @returns StopBotResponseDto Ok
     * @throws ApiError
     */
    public static stopBotById(
        id: string,
    ): CancelablePromise<StopBotResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bots/{id}/stop',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update bot configuration
     *
     * Updates the configuration of a bot without changing other properties.
     * This is a specialized endpoint for updating bot configuration settings.
     * @param id The unique identifier of the bot
     * @param requestBody
     * @returns UpdateBotConfigurationResponseDto Ok
     * @throws ApiError
     */
    public static updateBotConfiguration(
        id: string,
        requestBody: UpdateBotConfigurationRequestDto,
    ): CancelablePromise<UpdateBotConfigurationResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/bots/{id}/configuration',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate an invite link for a bot
     *
     * Creates an OAuth2 invite link that users can use to add the bot to their Discord servers.
     * The link includes permissions necessary for the bot to function properly.
     * @param id The unique identifier of the bot
     * @returns GenerateBotInviteLinkResponseDto Ok
     * @throws ApiError
     */
    public static generateInviteLink(
        id: string,
    ): CancelablePromise<GenerateBotInviteLinkResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bots/{id}/invite',
            path: {
                'id': id,
            },
        });
    }
}
