/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Placeholder interface for KnowledgeBase
 * This will be replaced with the actual definition by sync-types.js
 */
export type KnowledgeBase = {
    id: string;
    name: string;
    content: string;
    type: KnowledgeBase.type;
    source?: string;
};
export namespace KnowledgeBase {
    export enum type {
        TEXT = 'text',
        FILE = 'file',
    }
}

