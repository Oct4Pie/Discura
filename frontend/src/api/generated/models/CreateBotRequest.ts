/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotConfiguration } from './BotConfiguration';
/**
 * Create Bot Request
 */
export type CreateBotRequest = {
    name: string;
    discordToken: string;
    applicationId: string;
    intents?: Array<string>;
    configuration?: BotConfiguration;
};

