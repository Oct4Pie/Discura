/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ErrorResponseDto } from '../models/ErrorResponseDto';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { UserProfileResponseDto } from '../models/UserProfileResponseDto';
import type { UserResponseDto } from '../models/UserResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static login(): CancelablePromise<(UserResponseDto | ErrorResponseDto)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/undefined/login',
        });
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static register(): CancelablePromise<(UserResponseDto | ErrorResponseDto)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/undefined/register',
        });
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static getProfile(): CancelablePromise<(UserProfileResponseDto | ErrorResponseDto)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/undefined/profile',
        });
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static logout(): CancelablePromise<(MessageResponseDto | ErrorResponseDto)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/undefined/logout',
        });
    }
}
