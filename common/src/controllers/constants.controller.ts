/**
 * Constants Controller
 * 
 * Provides access to common constants for the frontend.
 */
import { Controller, Get, Route, Tags } from 'tsoa';
import { ConstantsResponseDto } from '../types/api/index';
import { CONTROLLER_ROUTES } from '../types/routes';

@Route(CONTROLLER_ROUTES.CONSTANTS)
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