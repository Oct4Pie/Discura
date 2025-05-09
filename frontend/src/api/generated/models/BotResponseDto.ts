/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotStatus } from './BotStatus';
import type { Record_string_any_ } from './Record_string_any_';
/**
 * Bot Response Data
 */
export type BotResponseDto = {
    id: string;
    userId: string;
    name: string;
    discordToken?: string;
    applicationId: string;
    status: BotStatus;
    intents: Array<string>;
    configuration: Record_string_any_;
    createdAt: string;
    updatedAt: string;
};

