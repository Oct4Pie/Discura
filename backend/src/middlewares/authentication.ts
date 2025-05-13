// src/middlewares/authentication.ts - JWT authentication for TSOA
import { JwtPayload } from "@discura/common/types/auth";
import { Request } from "express";
import * as jwt from "jsonwebtoken";

import config from "../config";
import { logger } from "../utils/logger";

export function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[],
): Promise<any> {
  if (securityName === "jwt") {
    // Log raw authorization header for debugging malformed JWT issues
    const rawAuthHeader = request.headers["authorization"];
    logger.info(`[Auth] Raw Authorization header: ${rawAuthHeader}`);

    // Extract token from Bearer schema
    const token = rawAuthHeader?.toString().split(" ")[1] ?? "";

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error("No token provided"));
        return;
      }

      jwt.verify(token, config.jwtSecret, (err: any, decoded: any) => {
        if (err) {
          reject(err);
        } else {
          // Add user to request
          (request as any).user = decoded as JwtPayload;
          resolve(decoded);
        }
      });
    });
  }

  return Promise.reject(new Error("Invalid security name"));
}
