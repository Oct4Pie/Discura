/**
 * Authentication Types
 * 
 * Shared types for authentication between backend and API definitions.
 * These types are used by the backend JWT implementation and by TSOA controllers.
 */

export * from '../auth/authentication';

// Define our custom JWT payload - abstract from backend implementation
export interface JwtPayload {
  id: string; 
  discordId: string;
  username: string;
  discriminator?: string;
  avatar?: string | null;
  email?: string | null;
}

// Type for auth function consumed by TSOA - implementation provided by backend
export type AuthenticationFunction = (
  request: any, // Express.Request in actual implementation
  securityName: string,
  scopes?: string[]
) => Promise<any>;