/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateBotRequest = {
    name: string;
    discordToken: string;
    applicationId: string;
    intents?: Array<string>;
    configuration?: {
        tools?: Array<{
            parameters?: Array<{
                required: boolean;
                description: string;
                type: string;
                name: string;
            }>;
            description: string;
            name: string;
            id?: string;
        }>;
        toolsEnabled?: boolean;
        imageGeneration?: {
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
        llmModel?: string;
        llmProvider?: string;
        backstory?: string;
        traits?: Array<string>;
        personality?: string;
        systemPrompt?: string;
    };
};

