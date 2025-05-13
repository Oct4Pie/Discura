/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotConfiguration } from './BotConfiguration';
/**
 * Create Bot Request DTO
 */
export type CreateBotRequestDto = {
    name: string;
    discordToken: string;
    applicationId?: string;
    intents?: Array<string>;
    configuration?: BotConfiguration;
};

