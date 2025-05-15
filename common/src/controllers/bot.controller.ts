import { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";

import { DISCORD_API } from "../constants";
import {
  BotResponseDto,
  BotsResponseDto,
  BotStatus,
  CreateBotRequest,
  CreateBotRequestDto,
  CreateBotResponseDto,
  UpdateBotRequest,
  UpdateBotRequestDto,
  UpdateBotResponseDto,
  GetAllBotsResponseDto,
  GetBotResponseDto,
  StartBotResponseDto,
  StopBotResponseDto,
  DeleteBotResponseDto,
  UpdateBotConfigurationRequestDto,
  UpdateBotConfigurationResponseDto,
  GenerateBotInviteLinkResponseDto,
  ErrorResponseDto,
  MessageResponseDto,
  TokenValidationResult,
} from "../types/api";
import { CONTROLLER_ROUTES, BASE_ROUTES, BOT_PATHS } from "../types/routes";

/**
 * Controller for managing Discord bots
 *
 * IMPORTANT: We use the string literals directly in the decorators
 * because TSOA doesn't properly resolve imported constants during generation.
 * These strings MUST match the constants in routes.constants.ts
 */
@Route("bots")
@Tags("Bots")
export class BotController extends Controller {
  /**
   * List all bots for the authenticated user
   *
   * Returns a list of Discord bots owned by the authenticated user,
   * including their configuration and status.
   */
  @Get()
  @Security("jwt")
  public async getUserBots(
    @Request() request: ExpressRequest,
  ): Promise<GetAllBotsResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Get a specific bot by ID
   *
   * Returns detailed information about a specific bot owned by the authenticated user.
   *
   * @param id The unique identifier of the bot
   */
  @Get("{id}")
  @Security("jwt")
  public async getBotById(
    @Path() id: string,
    @Request() request: ExpressRequest,
  ): Promise<GetBotResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Create a new bot
   *
   * Creates a new Discord bot with the specified configuration.
   * The bot will be owned by the authenticated user.
   */
  @Post()
  @Security("jwt")
  @SuccessResponse("201", "Bot created successfully")
  public async createBot(
    @Body() requestBody: CreateBotRequestDto,
    @Request() request: ExpressRequest,
  ): Promise<CreateBotResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Update an existing bot
   *
   * Updates the configuration of an existing bot owned by the authenticated user.
   *
   * @param id The unique identifier of the bot to update
   */
  @Put("{id}")
  @Security("jwt")
  public async updateBot(
    @Path() id: string,
    @Body() requestBody: UpdateBotRequestDto,
    @Request() request: ExpressRequest,
  ): Promise<UpdateBotResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Delete a bot
   *
   * Deletes a bot owned by the authenticated user.
   * If the bot is currently running, it will be stopped before deletion.
   *
   * @param id The unique identifier of the bot to delete
   */
  @Delete("{id}")
  @Security("jwt")
  public async deleteBot(
    @Path() id: string,
    @Request() request: ExpressRequest,
  ): Promise<DeleteBotResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Start a bot
   *
   * Starts a Discord bot that is currently stopped.
   *
   * @param id The unique identifier of the bot to start
   */
  @Post("{id}/start")
  @Security("jwt")
  public async startBotById(
    @Path() id: string,
    @Request() request: ExpressRequest,
  ): Promise<StartBotResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Stop a bot
   *
   * Stops a Discord bot that is currently running.
   *
   * @param id The unique identifier of the bot to stop
   */
  @Post("{id}/stop")
  @Security("jwt")
  public async stopBotById(
    @Path() id: string,
    @Request() request: ExpressRequest,
  ): Promise<StopBotResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Update bot configuration
   *
   * Updates the configuration of a bot without changing other properties.
   * This is a specialized endpoint for updating bot configuration settings.
   *
   * @param id The unique identifier of the bot
   */
  @Put("{id}/configuration")
  @Security("jwt")
  public async updateBotConfiguration(
    @Path() id: string,
    @Body() requestBody: UpdateBotConfigurationRequestDto,
    @Request() request: ExpressRequest,
  ): Promise<UpdateBotConfigurationResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Generate an invite link for a bot
   *
   * Creates an OAuth2 invite link that users can use to add the bot to their Discord servers.
   * The link includes permissions necessary for the bot to function properly.
   *
   * @param id The unique identifier of the bot
   */
  @Get("{id}/invite")
  @Security("jwt")
  public async generateInviteLink(
    @Path() id: string,
    @Request() request: ExpressRequest,
  ): Promise<GenerateBotInviteLinkResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Validate Discord bot token
   *
   * Validates a Discord bot token and checks if message content intent is enabled.
   * This endpoint doesn't require authentication as it's used during bot creation.
   */
  @Post("validate-token")
  public async validateToken(
    @Body() requestBody: { token: string },
  ): Promise<TokenValidationResult> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }

  /**
   * Force register slash commands for a bot in a specific server
   *
   * Manually triggers the registration of slash commands for a bot in a specific Discord server.
   * This can help when commands aren't showing up due to propagation delays or other issues.
   *
   * @param id The unique identifier of the bot
   * @param guildId The Discord server ID where commands should be registered
   */
  @Post("{id}/register-commands")
  @Security("jwt")
  public async registerBotCommands(
    @Path() id: string,
    @Body() requestBody: { guildId: string },
    @Request() request: ExpressRequest,
  ): Promise<MessageResponseDto> {
    // Implementation will be provided by backend
    throw new Error("Method not implemented in common package");
  }
}
