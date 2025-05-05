import express, { Request, Response } from 'express';
import passport from 'passport';
import config from '../config';

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

authRoutes.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login', session: false }),
  (req: Request, res: Response) => {
    // Handle successful authentication
    // In a real app, you would:
    // 1. Generate a JWT
    // 2. Set it as a cookie or send it in the response
    // 3. Redirect to the frontend

    // Redirect to frontend dashboard
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

// Mount auth routes
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

export default router;
