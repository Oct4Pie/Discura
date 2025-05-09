/**
 * Express request type extensions for authentication
 */
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

// Define our custom JWT payload
export interface JwtPayload extends jwt.JwtPayload {
  id: string; 
  discordId: string;
  username: string;
  discriminator: string; // Added to match User properties
  avatar: string | null; // Added to match User properties
  email?: string | null;
}

// Extend Express User interface to match our User model
declare global {
  namespace Express {
    // Update User interface to match actual User class structure
    interface User {
      id: string;
      discordId: string;
      username: string;
      discriminator: string;
      avatar: string | null;
      email: string | null; 
      createdAt?: Date;
      updatedAt?: Date;
    }
    
    // We can't override the existing user property, so we don't modify it here
  }
}