import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to log HTTP requests
 * Records method, path, status code, and response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Get start time
  const start = Date.now();
  const { method, originalUrl } = req;
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function with proper overload signatures
  function endFn(cb?: (() => void)): Response;
  function endFn(chunk: any, cb?: (() => void)): Response;
  function endFn(chunk: any, encoding: BufferEncoding, cb?: (() => void)): Response;
  function endFn(chunkOrCb?: any, encodingOrCb?: any, callback?: any): Response {
    // Calculate response time
    const responseTime = Date.now() - start;
    const { statusCode } = res;
    
    // Log the request
    logger.info(`${method} ${originalUrl} ${statusCode} ${responseTime}ms`);
    
    // Use the original method with proper casting to avoid TypeScript errors
    if (typeof chunkOrCb === 'function') {
      // @ts-ignore - We need to handle the function overload case
      return originalEnd.call(res, null, chunkOrCb);
    } else if (typeof encodingOrCb === 'function') {
      // @ts-ignore - We need to handle the function overload case
      return originalEnd.call(res, chunkOrCb, encodingOrCb);
    } else {
      return originalEnd.call(res, chunkOrCb, encodingOrCb as BufferEncoding, callback);
    }
  }
  
  // Replace the end function
  res.end = endFn;
  
  next();
};