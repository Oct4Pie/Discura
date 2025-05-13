import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";

import config from "../config";
import { User } from "../models/user.model";
import { logger } from "../utils/logger";

/**
 * Main router for non-TSOA routes.
 *
 * IMPORTANT: API routes decorated with TSOA annotations (@Route, @Get, etc.) are
 * automatically registered by the RegisterRoutes function in src/index.ts.
 * Do NOT manually define routes for TSOA controllers here!
 *
 * This router ONLY contains:
 * 1. OAuth-specific routes (Discord authentication)
 * 2. Health check endpoint
 */
const router = express.Router();

// --- Authentication Routes (Discord OAuth) ---
const authRoutes = express.Router();

// Public authentication endpoints
authRoutes.get(
  "/discord",
  passport.authenticate("discord", {
    scope: ["identify", "email"],
  }),
);

// Discord OAuth callback route
authRoutes.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/login",
    session: false,
  }),
  function (req: Request, res: Response) {
    try {
      // Ensure user object exists after authentication
      if (!req.user) {
        logger.error("Discord callback: Missing user object in request");
        res.redirect(`${config.frontendUrl}/login?error=authentication_failed`);
        return;
      }

      // Cast to User type
      const user = req.user as User;

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, discordId: user.discordId },
        config.jwtSecret,
        { expiresIn: "7d" },
      );

      logger.info(
        `Auth successful for user: ${user.username}, redirecting to callback with token`,
      );

      // Redirect to frontend AuthCallback with the token (URL-encoded)
      res.redirect(
        `${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`,
      );
    } catch (error) {
      logger.error("OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=server_error`);
    }
  },
);

// Mount auth routes
router.use("/auth", authRoutes);

// Health check endpoint
router.get("/health", function (_req: Request, res: Response) {
  res.status(200).send("OK");
});

export default router;
