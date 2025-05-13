/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotConfiguration } from './BotConfiguration';
import type { BotStatus } from './BotStatus';
/**
 * Update Bot Response DTO
 */
export type UpdateBotResponseDto = {
    id: string;
    userId: string;
    name: string;
    discordToken?: string;
    applicationId: string;
    status: BotStatus;
    intents: Array<string>;
    configuration: BotConfiguration;
    createdAt: string;
    updatedAt: string;
};

