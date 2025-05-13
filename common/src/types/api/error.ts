/**
 * Error API Types
 *
 * This file contains common error response types used across the API.
 */

/**
 * Standard Error Response DTO
 * @tsoaModel
 */
export interface ErrorResponseDto {
  message: string;
  error?: string;
}
