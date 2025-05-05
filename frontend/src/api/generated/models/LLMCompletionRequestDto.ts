/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMCompletionMessage } from './LLMCompletionMessage';
export type LLMCompletionRequestDto = {
    model: string;
    messages: Array<LLMCompletionMessage>;
    temperature?: number;
    top_p?: number;
    'n'?: number;
    stream?: boolean;
    stop?: (string | Array<string>);
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    user?: string;
};

