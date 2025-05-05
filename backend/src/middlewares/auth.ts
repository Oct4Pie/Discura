import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserAdapter } from '../models/user.model';
import { logger } from '../utils/logger';

// Middleware to check if user is authenticated with Passport
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: 'Unauthorized - Not authenticated' });
};

// Middleware to check if user is authenticated with JWT
export const isAuthenticatedJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await UserAdapter.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - Invalid user' });
    }
    
    // Add user to request object
    req.user = decoded; // Store jwt payload instead of full user object
    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};
