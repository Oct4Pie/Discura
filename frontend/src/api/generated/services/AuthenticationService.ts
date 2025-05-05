/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { UserProfileResponseDto } from '../models/UserProfileResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Get the authenticated user's profile
     * @returns UserProfileResponseDto Ok
     * @throws ApiError
     */
    public static getUserProfile(): CancelablePromise<UserProfileResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/profile',
            errors: {
                401: `Unauthorized`,
                404: `User not found`,
                500: `Server Error`,
            },
        });
    }
    /**
     * Log out the current user
     * @returns MessageResponseDto Ok
     * @throws ApiError
     */
    public static logout(): CancelablePromise<MessageResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
            errors: {
                500: `Server Error`,
            },
        });
    }
}
