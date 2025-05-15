/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityType } from './ActivityType';
/**
 * Bot Appearance Configuration
 */
export type AppearanceConfig = {
    avatarUrl?: string;
    presence?: {
        activity?: {
            url?: string;
            type: ActivityType;
            name: string;
        };
        status?: AppearanceConfig.status;
    };
    colors?: {
        accent?: string;
        primary?: string;
    };
};
export namespace AppearanceConfig {
    export enum status {
        ONLINE = 'online',
        IDLE = 'idle',
        DND = 'dnd',
        INVISIBLE = 'invisible',
    }
}

