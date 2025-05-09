/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotStatus } from './BotStatus';
import type { Record_string_any_ } from './Record_string_any_';
/**
 * Update Bot Request
 */
export type UpdateBotRequest = {
    name?: string;
    discordToken?: string;
    applicationId?: string;
    intents?: Array<string>;
    status?: BotStatus;
    configuration?: Record_string_any_;
};

