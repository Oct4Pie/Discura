/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotStatus } from './BotStatus';
export type UpdateBotRequest = {
    name?: string;
    discordToken?: string;
    applicationId?: string;
    intents?: Array<string>;
    status?: BotStatus;
    configuration?: {
        tools?: Array<{
            implementation?: string;
            parameters?: Array<{
                required: boolean;
                description: string;
                type: string;
                name: string;
            }>;
            description: string;
            name: string;
            id: string;
        }>;
        toolsEnabled?: boolean;
        imageGeneration?: {
            apiKey?: string;
            model?: string;
            provider?: string;
            enabled?: boolean;
        };
        knowledge?: Array<{
            source?: string;
            type: string;
            content: string;
            name: string;
            id?: string;
        }>;
        apiKey?: string;
        llmModel?: string;
        llmProvider?: string;
        backstory?: string;
        traits?: Array<string>;
        personality?: string;
        systemPrompt?: string;
    };
};

