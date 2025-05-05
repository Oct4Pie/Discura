// src/controllers/tsoa/auth.controller.ts
import { ErrorResponseDto, MessageResponseDto, UserProfileResponseDto, UserResponseDto } from '@common/types/api';
import { ROUTES } from '@common/types/routes'; // Import route constants
import {
    Controller,
    Get,
    Post,
    Request,
    Response,
    Route,
    Security,
    Tags
} from 'tsoa';
import { UserAdapter } from '../../models/user.model';
import { JwtPayload } from '../../types/express';
import { logger } from '../../utils/logger';
import { Request as ExpressRequest } from 'express';

@Route(ROUTES.AUTH) // Using constant instead of hard-coded string
@Tags('Authentication')
export class AuthController extends Controller {
  /**
   * Get the Express request object
   */
  protected getRequest(): ExpressRequest {
    // @ts-ignore - TSOA injects this at runtime
    return this.request;
  }

  /**
   * Get the authenticated user's profile
   */
  @Get('profile')
  @Security('jwt')
  @Response<ErrorResponseDto>(401, 'Unauthorized')
  @Response<ErrorResponseDto>(404, 'User not found')
  @Response<ErrorResponseDto>(500, 'Server Error')
  public async getUserProfile(): Promise<UserProfileResponseDto> { 
    try {
      // Get the user ID from the JWT payload (this will be populated by your auth middleware)
      const req = this.getRequest();
      const jwtPayload = req.user as JwtPayload; 
      
      if (!jwtPayload?.id) {
        this.setStatus(401);
        throw new Error('Unauthorized');
      }

      // Fetch user data based on the ID from the JWT payload
      const user = await UserAdapter.findById(jwtPayload.id);

      if (!user) {
        this.setStatus(404);
        throw new Error('User not found');
      }

      // Map the user to the UserResponseDto
      const userResponse: UserResponseDto = {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        discriminator: user.discriminator || '',
        avatar: user.avatar || '',
        email: user.email || '',
        bots: [] // Initialize with empty array since SQLite adapter doesn't provide bots directly
      };
      
      return { user: userResponse };
    } catch (error) {
        logger.error('Get user profile error:', error);
        if (error instanceof Error) {
             if (error.message === 'Unauthorized') {
                 this.setStatus(401);
             } else if (error.message === 'User not found') {
                 this.setStatus(404);
             } else {
                 this.setStatus(500);
             }
             throw error;
        } else {
             this.setStatus(500);
             throw new Error('An unknown error occurred');
        }
    }
  }
  
  /**
   * Log out the current user
   */
  @Post('logout')
  @Security('jwt')
  @Response<ErrorResponseDto>(500, 'Server Error')
  public async logout(): Promise<MessageResponseDto> {
     const req = this.getRequest();
     const jwtPayload = req.user as JwtPayload; 
     
     if (!jwtPayload?.id) {
        this.setStatus(401); 
        throw new Error('Unauthorized'); 
     }
     
     logger.info(`User ${jwtPayload.id} logout request received.`);
     return {
       message: 'Logout successful'
     };
  }
}
