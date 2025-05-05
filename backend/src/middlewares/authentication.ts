// src/middlewares/authentication.ts - JWT authentication for TSOA
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config';

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
          // Add user to request
          request.user = decoded;
          resolve(decoded);
        }
      });
    });
  }
  
  return Promise.reject(new Error("Invalid security name"));
}
