/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotConfiguration } from './BotConfiguration';
import type { BotStatus } from './BotStatus';
/**
 * Update Bot Request DTO
 */
export type UpdateBotRequestDto = {
    name?: string;
    discordToken?: string;
    applicationId?: string;
    intents?: Array<string>;
    status?: BotStatus;
    configuration?: BotConfiguration;
};

