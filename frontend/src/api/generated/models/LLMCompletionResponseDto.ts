/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMCompletionResponseChoice } from './LLMCompletionResponseChoice';
import type { LLMCompletionResponseUsage } from './LLMCompletionResponseUsage';
export type LLMCompletionResponseDto = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<LLMCompletionResponseChoice>;
    usage: LLMCompletionResponseUsage;
};

