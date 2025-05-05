import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, UserAdapter } from '../models/user.model'; // Import adapter instead of Mongoose model
import { logger } from '../utils/logger';
import { JwtPayload } from '../types/express'; // Import our own JwtPayload
import { UserProfileResponseDto, UserResponseDto } from '@common/types/api'; // Import both DTOs

// Login using Discord OAuth (callback)
export const loginWithDiscord = (req: Request, res: Response) => {
  try {
    // User is already authenticated by Passport at this point
    if (!req.user) {
      return res.status(401).redirect(`${config.frontendUrl}/login?error=authentication_failed`);
    }
    
    // Cast req.user to User to access properties safely
    const user = req.user as User;
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, discordId: user.discordId }, // Use id instead of _id
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).redirect(`${config.frontendUrl}/login?error=server_error`);
  }
};

// Get current user profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming JWT middleware populates req.user with JwtPayload
    const jwtPayload = req.user as JwtPayload; // Use JwtPayload type
    if (!jwtPayload?.id) {
       return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Use UserAdapter instead of direct model access
    const user = await UserAdapter.findById(jwtPayload.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Map user to UserResponseDto first, then wrap in UserProfileResponseDto
    const userResponse: UserResponseDto = {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        discriminator: user.discriminator || '',
        avatar: user.avatar || '', // Handle potential null/undefined
        email: user.email || '', // Handle potential null/undefined
        bots: [] // Will be populated by botAdapter if needed
    };
    
    // Create the properly structured UserProfileResponseDto
    const userProfile: UserProfileResponseDto = {
        user: userResponse
    };
    
    return res.json(userProfile);
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
export const logout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};
