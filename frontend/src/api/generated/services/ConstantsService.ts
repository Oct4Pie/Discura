/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConstantsResponseDto } from '../models/ConstantsResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConstantsService {
    /**
     * Get all application constants
     * @returns ConstantsResponseDto Ok
     * @throws ApiError
     */
    public static getConstants(): CancelablePromise<ConstantsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/constants',
        });
    }
}
