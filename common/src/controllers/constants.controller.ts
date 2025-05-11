/**
 * Constants Controller
 * 
 * Provides access to common constants for the frontend.
 */
import { Controller, Get, Route, Tags } from 'tsoa';
import { CONTROLLER_ROUTES, BASE_ROUTES } from '../types/routes';
import { ConstantsResponseDto } from '../types';

/**
 * Controller for providing application constants to the frontend
 * 
 * IMPORTANT: We use the string literals directly in the decorators
 * because TSOA doesn't properly resolve imported constants during generation.
 * These strings MUST match the constants in routes.constants.ts
 */
@Route("constants")
@Tags('Constants')
export class ConstantsController extends Controller {
  /**
   * Get all application constants
   */
  @Get()
  public async getConstants(): Promise<ConstantsResponseDto> {
    throw new Error('Method not implemented in common package');
  }
}