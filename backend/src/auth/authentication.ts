/**
 * Backend Authentication Module for TSOA
 * 
 * This file overrides the placeholder implementation in common/src/auth/authentication.ts
 * by re-exporting the backend's actual implementation.
 * 
 * When the backend registers TSOA routes, this file will be used instead of the common
 * package's placeholder, ensuring proper authentication.
 */

import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config';
import { AuthenticationFunction, JwtPayload } from '@discura/common/types/auth';
import { logger } from '../utils/logger';

/**
 * Real authentication implementation for JWT token validation
 * This will be used by TSOA instead of the common package's placeholder
 */
export const expressAuthentication: AuthenticationFunction = async (
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> => {
  if (securityName === 'jwt') {
    const token = request.headers['authorization']?.split(' ')[1];

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error("No token provided"));
        return;
      }

      jwt.verify(token, config.jwtSecret, function (err: any, decoded: any) {
        if (err) {
          reject(err);
        } else {
          // Add user to request - cast to any to avoid type conflicts
          (request as any).user = decoded as JwtPayload;
          logger.debug(`User authenticated: ${(decoded as JwtPayload).sub}`);
          resolve(decoded);
        }
      });
    });
  }
  
  return Promise.reject(new Error("Invalid security name"));
}