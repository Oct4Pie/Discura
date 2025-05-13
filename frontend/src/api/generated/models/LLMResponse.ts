/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * LLM Response data
 */
export type LLMResponse = {
    text: string;
    generateImage?: boolean;
    imagePrompt?: string;
    toolCalls?: Array<{
        content?: string;
        type?: string;
        arguments: any;
        name: string;
    }>;
};

