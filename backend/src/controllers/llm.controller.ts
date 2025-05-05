// src/controllers/llm.controller.ts
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from '../types/express';
import { logger } from '../utils/logger';
import * as LLMService from '../services/llm.service';
import { LLMCompletionRequestDto } from '@common/types/api';

/**
 * Get available LLM models
 */
export const getModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const models = await LLMService.listModels();
    
    return res.json({
      object: "list",
      data: models
    });
  } catch (error) {
    logger.error('Get LLM models error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a chat completion with the LLM
 */
export const createChatCompletion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtPayload = req.user as JwtPayload;
    if (!jwtPayload?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const completionRequest = req.body as LLMCompletionRequestDto;
    
    // Validate required fields
    if (!completionRequest.model || !completionRequest.messages || completionRequest.messages.length === 0) {
      return res.status(400).json({ message: 'Model and messages are required' });
    }

    // Handle streaming if requested
    if (completionRequest.stream) {
      // Set appropriate headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send streaming response
      return LLMService.createStreamingChatCompletion(completionRequest, jwtPayload.id, res);
    } else {
      // Generate non-streaming completion
      const result = await LLMService.createChatCompletion(completionRequest, jwtPayload.id);
      return res.json(result);
    }
  } catch (error) {
    logger.error('LLM chat completion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};