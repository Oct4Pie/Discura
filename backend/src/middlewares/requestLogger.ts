import { Request, Response, NextFunction } from "express";

import { JwtPayload } from "../types/express";
import { logger } from "../utils/logger";

/**
 * Sanitize sensitive data from objects before logging
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  const sensitiveFields = [
    "password",
    "token",
    "apiKey",
    "discordToken",
    "authorization",
  ];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Enhanced middleware to log HTTP requests with detailed information
 * Records method, path, query params, headers, body, user info, status code, and response time
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Get start time and basic request info
  const start = Date.now();
  const { method, originalUrl } = req;

  // Log request details
  const requestData = {
    timestamp: new Date().toISOString(),
    method,
    url: originalUrl,
    query: sanitizeData(req.query),
    headers: sanitizeData(req.headers),
    body: sanitizeData(req.body),
    userId: (req.user as JwtPayload)?.id || "unauthenticated",
  };

  logger.info("Incoming request:", requestData);

  // Store original end function
  const originalEnd = res.end;

  // Override end function with proper overload signatures
  function endFn(this: Response, cb?: () => void): Response;
  function endFn(this: Response, chunk: any, cb?: () => void): Response;
  function endFn(
    this: Response,
    chunk: any,
    encoding: BufferEncoding,
    cb?: () => void,
  ): Response;
  function endFn(
    this: Response,
    chunkOrCb?: any,
    encodingOrCb?: any,
    callback?: any,
  ): Response {
    // Calculate response time
    const responseTime = Date.now() - start;
    const { statusCode } = res;

    // Prepare response data
    const responseData = {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId: (req.user as JwtPayload)?.id || "unauthenticated",
    };

    // Log based on status code
    if (statusCode >= 500) {
      logger.error("Server error response:", responseData);
    } else if (statusCode >= 400) {
      logger.warn("Client error response:", responseData);
    } else {
      logger.info("Successful response:", responseData);
    }

    // Add response logging for important endpoints
    if (originalUrl.includes("/auth") || statusCode >= 400) {
      try {
        // Try to parse response body if it's JSON
        let responseBody = null;
        if (typeof chunkOrCb === "string") {
          responseBody = JSON.parse(chunkOrCb);
        } else if (Buffer.isBuffer(chunkOrCb)) {
          responseBody = JSON.parse(chunkOrCb.toString());
        }

        if (responseBody) {
          logger.debug("Response body:", sanitizeData(responseBody));
        }
      } catch (error) {
        // Ignore parsing errors - response might not be JSON
      }
    }

    // Use the original method with proper casting to avoid TypeScript errors
    if (typeof chunkOrCb === "function") {
      return originalEnd.call(this, undefined, chunkOrCb);
    } else if (typeof encodingOrCb === "function") {
      return originalEnd.call(this, chunkOrCb, encodingOrCb);
    }
    return originalEnd.call(
      this,
      chunkOrCb,
      encodingOrCb as BufferEncoding,
      callback,
    );
  }

  // Replace the end function
  res.end = endFn;

  next();
};
