/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Record_string_any_ } from './Record_string_any_';
/**
 * Create Bot Request
 */
export type CreateBotRequest = {
    name: string;
    discordToken: string;
    applicationId: string;
    intents?: Array<string>;
    configuration?: Record_string_any_;
};

