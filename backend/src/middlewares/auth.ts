import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import config from "../config";
import { UserAdapter } from "../models/adapters/user.adapter";
import { JwtPayload } from "../types/express";
import { logger } from "../utils/logger";

// Middleware to check if user is authenticated with Passport
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized - Not authenticated" });
};

// Middleware to check if user is authenticated with JWT
export const isAuthenticatedJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized - No token provided" });
      return;
    }

    // Verify token and get the basic decoded information
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };

    // Find the complete user object
    const user = await UserAdapter.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: "Unauthorized - Invalid user" });
      return;
    }

    // Store the full user object from the adapter to meet type requirements
    req.user = user;
    next();
  } catch (error) {
    logger.error("JWT authentication error:", error);
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return;
  }
};
