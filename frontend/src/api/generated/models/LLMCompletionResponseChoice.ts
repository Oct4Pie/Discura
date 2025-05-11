/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMCompletionMessage } from './LLMCompletionMessage';
/**
 * LLM Completion Response Choice
 */
export type LLMCompletionResponseChoice = {
    index: number;
    message: LLMCompletionMessage;
    finish_reason: string;
};

