// src/api/index.ts
import axios from 'axios';
import {
  BotResponseDto,
  BotsResponseDto,
  CreateBotRequest,
  UpdateBotRequest as CommonUpdateBotRequest,
  UserProfileResponseDto,
  LLMModelsResponseDto,
  LLMCompletionRequestDto,
  LLMCompletionResponseDto
} from '@common/types/api';
import { API_ROUTES } from '@common/types/routes';
import { STORAGE_KEYS } from '@common/constants';

// Import the generated API services
import { OpenAPI } from './generated/core/OpenAPI';
import { BotsService } from './generated/services/BotsService';
import { AuthenticationService } from './generated/services/AuthenticationService';
import { LlmService } from './generated/services/LlmService';
import { KnowledgeService } from './generated/services/KnowledgeService';
import { UpdateBotRequest as GeneratedUpdateBotRequest } from './generated/models/UpdateBotRequest';

// Configure the OpenAPI client with our base URL
OpenAPI.BASE = import.meta.env.VITE_API_URL || '';

// Create an axios instance for custom requests
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor to inject auth token
api.interceptors.request.use(
  (config) => {
    // Get token from local storage using constant key
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);
    
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken.state?.token) {
          config.headers.Authorization = `Bearer ${parsedToken.state.token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth token:', e);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Use the generated services directly - creating type-safe wrappers
export const botApi = {
  // Get all bots for the current user
  getUserBots: () => BotsService.getUserBots(),
  
  // Get a specific bot by ID
  getBotById: (id: string) => BotsService.getBotById(id),
  
  // Create a new bot
  createBot: (bot: CreateBotRequest) => BotsService.createBot(bot),
  
  // Update a bot - use type assertion to handle the BotStatus enum mismatch
  updateBot: (id: string, bot: CommonUpdateBotRequest) => 
    BotsService.updateBot(id, bot as unknown as GeneratedUpdateBotRequest),
  
  // Delete a bot
  deleteBot: (id: string) => BotsService.deleteBot(id),
  
  // Start a bot
  startBot: (id: string) => BotsService.startBotById(id),
  
  // Stop a bot
  stopBot: (id: string) => BotsService.stopBotById(id)
};

export const authApi = {
  // Get current user profile
  getUserProfile: () => AuthenticationService.getUserProfile(),
  
  // Logout
  logout: () => AuthenticationService.logout()
};

export const llmApi = {
  // Get available LLM models
  getModels: () => LlmService.getModels(),
  
  // Create a chat completion
  createChatCompletion: (request: LLMCompletionRequestDto) => 
    LlmService.createChatCompletion(request)
};

// Add Knowledge API
export const knowledgeApi = {
  // Get all knowledge items for a bot
  getKnowledgeItems: (botId: string) => KnowledgeService.getKnowledgeItems(botId),
  
  // Add a knowledge item
  addKnowledgeItem: (botId: string, item: {
    title: string;
    content: string;
    type: string;
    priority?: number;
  }) => KnowledgeService.addKnowledgeItem(botId, item),
  
  // Update a knowledge item
  updateKnowledgeItem: (botId: string, itemId: string, item: {
    title?: string;
    content?: string;
    type?: string;
    priority?: number;
  }) => KnowledgeService.updateKnowledgeItem(botId, itemId, item),
  
  // Delete a knowledge item
  deleteKnowledgeItem: (botId: string, itemId: string) => 
    KnowledgeService.deleteKnowledgeItem(botId, itemId)
};

// Export the raw API client for any custom requests
export default api;
