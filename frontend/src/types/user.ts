/**
 * User type definitions for the frontend
 * 
 * Following Discura Project Guidelines, we use types directly from the generated
 * API models as the single source of truth.
 */

import { UserResponseDto } from '../api'
import { UserProfileResponseDto } from '../api/';

/**
 * For frontend use, we directly use the API-generated UserResponseDto
 * This follows the single source of truth principle from the Discura Project Guidelines
 */
export type User = UserResponseDto;

/**
 * Helper function to convert a UserProfileResponseDto to a User
 * Extracts the user data from the nested object structure
 */
export function toUserModel(dto: UserProfileResponseDto): User {
  return dto.user;
}