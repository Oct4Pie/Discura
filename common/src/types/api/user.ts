/**
 * User API Types
 * 
 * This file contains all API types related to the User service.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

/**
 * User Response Data
 * @tsoaModel
 */
export interface UserResponseDto {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  bots: string[];
}

/**
 * User Profile Response Data
 * @tsoaModel
 */
export interface UserProfileResponseDto {
  user: UserResponseDto;
}