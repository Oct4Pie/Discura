/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotResponseDto } from '../models/BotResponseDto';
import type { BotsResponseDto } from '../models/BotsResponseDto';
import type { CreateBotRequest } from '../models/CreateBotRequest';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { UpdateBotRequest } from '../models/UpdateBotRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BotsService {
    /**
     * List all bots for the authenticated user
     *
     * Returns a list of Discord bots owned by the authenticated user,
     * including their configuration and status.
     * @returns BotsResponseDto Ok
     * @throws ApiError
     */
    public static getUserBots(): CancelablePromise<BotsResponseDto> {
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
     * @returns BotResponseDto Bot created successfully
     * @throws ApiError
     */
    public static createBot(
        requestBody: CreateBotRequest,
    ): CancelablePromise<BotResponseDto> {
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
     * @returns any Ok
     * @throws ApiError
     */
    public static getBotById(
        id: string,
    ): CancelablePromise<{
        bot: BotResponseDto;
    }> {
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
     * @returns BotResponseDto Ok
     * @throws ApiError
     */
    public static updateBot(
        id: string,
        requestBody: UpdateBotRequest,
    ): CancelablePromise<BotResponseDto> {
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
     * @returns MessageResponseDto Ok
     * @throws ApiError
     */
    public static deleteBot(
        id: string,
    ): CancelablePromise<MessageResponseDto> {
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
     * @returns BotResponseDto Ok
     * @throws ApiError
     */
    public static startBotById(
        id: string,
    ): CancelablePromise<BotResponseDto> {
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
     * @returns BotResponseDto Ok
     * @throws ApiError
     */
    public static stopBotById(
        id: string,
    ): CancelablePromise<BotResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bots/{id}/stop',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Generate an invite link for a bot
     *
     * Creates an OAuth2 invite link that users can use to add the bot to their Discord servers.
     * The link includes permissions necessary for the bot to function properly.
     * @param id The unique identifier of the bot
     * @returns any Ok
     * @throws ApiError
     */
    public static generateInviteLink(
        id: string,
    ): CancelablePromise<{
        inviteUrl: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bots/{id}/invite',
            path: {
                'id': id,
            },
        });
    }
}
