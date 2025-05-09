import { CONTROLLER_ROUTES } from 'common/types/routes';
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
 } from "common/schema/types";

/**
 * Authentication controller
 * Handles user authentication and profile management
 */
@Route(CONTROLLER_ROUTES.AUTH)
@Tags('Authentication')
export class AuthController extends Controller {
  @Post('login')
  public async login(
    @Request() request: ExpressRequest
  ): Promise<UserResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }

  @Post('register')
  public async register(
    @Request() request: ExpressRequest
  ): Promise<UserResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }

  @Get('profile')
  @Security('jwt')
  public async getProfile(
    @Request() request: ExpressRequest
  ): Promise<UserProfileResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }

  @Post('logout')
  @Security('jwt')
  public async logout(
    @Request() request: ExpressRequest
  ): Promise<MessageResponseDto | ErrorResponseDto> {
    // Implementation will be provided by backend
    throw new Error('Method not implemented in common package');
  }
}