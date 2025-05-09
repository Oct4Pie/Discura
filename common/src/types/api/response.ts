/**
 * Common API Response Types
 * 
 * This file contains common response types used across different API endpoints.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

/**
 * Simple message response
 * @tsoaModel
 */
export interface MessageResponseDto {
  message: string;
}