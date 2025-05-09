// src/middlewares/authentication.ts - JWT authentication for TSOA
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config';
import { JwtPayload } from '@discura/common/types/auth';
import { logger } from '../utils/logger';

export function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
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
          // Add user to request - cast to any to avoid type conflicts with Express and Passport
          (request as any).user = decoded as JwtPayload;
          resolve(decoded);
        }
      });
    });
  }
  
  return Promise.reject(new Error("Invalid security name"));
}
