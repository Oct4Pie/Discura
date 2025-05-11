import {
    Controller,
    Get,
    Post,
    Request,
    Response,
    Route,
    Security,
    Tags
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import {
  ErrorResponseDto,
  MessageResponseDto,
  UserProfileResponseDto,
  UserResponseDto
  } from "../types";

/**
 * Authentication controller
 * Handles user authentication and profile management
 * 
 * IMPORTANT: We use the string literals directly in the decorators
 * because TSOA doesn't properly resolve imported constants during generation.
 * These strings MUST match the constants in routes.constants.ts
 */
@Route("auth")
@Tags('Authentication')
export class AuthController extends Controller {
  /**
   * Login with credentials
   */
  @Post('login')
  public async login(
    @Request() request: ExpressRequest
  ): Promise<UserResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }

  /**
   * Register a new user
   */
  @Post('register')
  public async register(
    @Request() request: ExpressRequest
  ): Promise<UserResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @Security('jwt')
  public async getProfile(
    @Request() request: ExpressRequest
  ): Promise<UserProfileResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }

  /**
   * Logout current user
   */
  @Post('logout')
  @Security('jwt')
  public async logout(
    @Request() request: ExpressRequest
  ): Promise<MessageResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
}