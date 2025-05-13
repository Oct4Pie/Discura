/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomProviderConfig } from './CustomProviderConfig';
import type { Record_string_any_ } from './Record_string_any_';
/**
 * Provider Configuration - Used to enable/disable and configure providers
 */
export type ProviderConfiguration = {
    enabled: boolean;
    config?: Record_string_any_;
    custom_providers?: Array<CustomProviderConfig>;
};

