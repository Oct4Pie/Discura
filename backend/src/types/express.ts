/**
 * Express request type extensions for authentication
 */
import { JwtPayload } from "@discura/common";
import { Request } from "express";
import * as jwt from "jsonwebtoken";

// Re-export the JwtPayload from common package
export { JwtPayload };

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
