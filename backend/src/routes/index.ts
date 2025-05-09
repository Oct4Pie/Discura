import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import config from '../config';
import jwt from 'jsonwebtoken';
import { User, UserAdapter } from '../models/user.model';
import { logger } from '../utils/logger';
import { isAuthenticatedJWT } from '../middlewares/auth';
import { JwtPayload } from '../types/express';
import { UserResponseDto, UserProfileResponseDto } from '@discura/common/schema/types';

/**
 * Main router for non-TSOA routes.
 * 
 * IMPORTANT: API routes decorated with TSOA annotations (@Route, @Get, etc.) are 
 * automatically registered by the RegisterRoutes function in src/index.ts.
 * Do NOT manually define routes for TSOA controllers here!
 */
const router = express.Router();

// --- Authentication Routes (Discord OAuth) ---
const authRoutes = express.Router();

// Public authentication endpoints
authRoutes.get('/discord', passport.authenticate('discord', {
  scope: ['identify', 'email']
}));

// Discord OAuth callback route
authRoutes.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login', session: false }),
  function(req: Request, res: Response) {
    try {
      // Ensure user object exists after authentication
      if (!req.user) {
        logger.error('Discord callback: Missing user object in request');
        res.redirect(`${config.frontendUrl}/login?error=authentication_failed`);
        return;
      }

      // Cast to User type
      const user = req.user as User;
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, discordId: user.discordId },
        config.jwtSecret,
        { expiresIn: '7d' }
      );
      
      logger.info(`Auth successful for user: ${user.username}, redirecting to callback with token`);
      
      // Redirect to frontend AuthCallback with the token
      res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}/login?error=server_error`);
    }
  }
);

// Get current user profile handler
async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const jwtPayload = req.user as JwtPayload;
  
  if (!jwtPayload?.id) {
    logger.error('Get profile error: No user ID in JWT payload');
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  
  logger.info(`Fetching profile for user ID: ${jwtPayload.id}`);
  
  try {
    const user = await UserAdapter.findById(jwtPayload.id);
    
    if (!user) {
      logger.error(`Get profile error: No user found for ID ${jwtPayload.id}`);
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Map to UserResponseDto
    const userResponse: UserResponseDto = {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      discriminator: user.discriminator || '',
      avatar: user.avatar || '',
      email: user.email || '',
      bots: [] // Will be populated separately if needed
    };
    
    const userProfile: UserProfileResponseDto = {
      user: userResponse
    };
    
    logger.info(`Profile fetched successfully for user: ${user.username}`);
    res.json(userProfile);
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Register user profile route
authRoutes.get('/profile', isAuthenticatedJWT, (req, res, next) => {
    getUserProfile(req, res, next).catch(next);
});

// Handle user logout
function handleLogout(req: Request, res: Response, next: NextFunction): void {
  const user = req.user as JwtPayload;
  logger.info(`Logout request received for user ID: ${user?.id}`);
  
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      res.status(500).json({ message: 'Logout failed' });
      return;
    }
    logger.info('User logged out successfully');
    res.json({ message: 'Logged out successfully' });
  });
}

// Register logout route
authRoutes.post('/logout', isAuthenticatedJWT, (req, res, next) => {
    try {
        handleLogout(req, res, next);
    } catch (error) {
        next(error);
    }
});

// Mount auth routes
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', function(_req: Request, res: Response) {
  res.status(200).send('OK');
});

export default router;
