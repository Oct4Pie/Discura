// /Users/m3hdi/Discura/backend/src/types/express.d.ts
import { UserDocument } from '../models/user.model'; // Adjust path as needed

// Define the structure of the JWT payload
export interface JwtPayload {
  id: string; // This should match what's put into the JWT
  discordId: string;
  // Add other properties if they are in the JWT payload
}


declare global {
  namespace Express {
    export interface Request {
      user?: UserDocument | JwtPayload; // Use UserDocument if deserialized from session, JwtPayload if from JWT
    }
  }
}

// Export something to make it a module
export { };

