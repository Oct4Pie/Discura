/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Model capabilities and features
 */
export type ModelCapabilities = {
    input_modalities: Array<string>;
    output_modalities: Array<string>;
    supports_tool_calling?: boolean;
    supports_streaming?: boolean;
    supports_vision?: boolean;
};

