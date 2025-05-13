import { create } from 'zustand';
import { FrontendBot, toBotModel, toBotModels, BotConfiguration } from '../types';
import { AuthenticationService, BotsService } from '../api';
import { CreateBotRequestDto, TokenValidationResult, UpdateBotRequestDto } from '../api';
import { OpenAPI } from '../api/generated/core/OpenAPI';
import { request } from '../api/generated/core/request';

interface BotsState {
  bots: FrontendBot[];
  currentBot: FrontendBot | null;
  isLoading: boolean;
  error: string | null;
  
  fetchBots: () => Promise<void>;
  fetchBot: (id: string) => Promise<void>;
  createBot: (botData: Partial<FrontendBot>) => Promise<FrontendBot>;
  updateBot: (id: string, botData: Partial<FrontendBot>) => Promise<FrontendBot>;
  deleteBot: (id: string) => Promise<void>;
  startBot: (id: string) => Promise<FrontendBot>;
  stopBot: (id: string) => Promise<FrontendBot>;
  updateBotConfiguration: (id: string, config: Partial<BotConfiguration>) => Promise<FrontendBot>;
  validateToken: (token: string) => Promise<TokenValidationResult>;
}

export const useBotStore = create<BotsState>((set, get) => ({
  bots: [],
  currentBot: null,
  isLoading: false,
  error: null,
  
  fetchBots: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client which will use OpenAPI.BASE = '/api'
      // This follows the single source of truth principle in the project guidelines
      const response = await BotsService.getUserBots();
      
      if (response && response.bots) {
        set({ bots: toBotModels(response.bots), isLoading: false });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
      set({ error: 'Failed to fetch bots', isLoading: false });
    }
  },
  
  fetchBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client
      const response = await BotsService.getBotById(id);
      
      if (response && response.bot) {
        set({ currentBot: toBotModel(response.bot), isLoading: false });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Error fetching bot ${id}:`, error);
      set({ error: 'Failed to fetch bot details', isLoading: false });
    }
  },
  
  createBot: async (botData: Partial<FrontendBot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client
      const response = await BotsService.createBot(botData as CreateBotRequestDto);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: [...state.bots, bot],
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error('Error creating bot:', error);
      set({ error: 'Failed to create bot', isLoading: false });
      throw error;
    }
  },
  
  updateBot: async (id: string, botData: Partial<FrontendBot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client
      const response = await BotsService.updateBot(id, botData as UpdateBotRequestDto);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: state.bots.map((b: FrontendBot) => b.id === id ? bot : b),
        currentBot: state.currentBot?.id === id ? bot : state.currentBot,
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error(`Error updating bot ${id}:`, error);
      set({ error: 'Failed to update bot', isLoading: false });
      throw error;
    }
  },
  
  deleteBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client
      await BotsService.deleteBot(id);
      
      set(state => ({
        bots: state.bots.filter((bot: FrontendBot) => bot.id !== id),
        currentBot: state.currentBot?.id === id ? null : state.currentBot,
        isLoading: false
      }));
    } catch (error) {
      console.error(`Error deleting bot ${id}:`, error);
      set({ error: 'Failed to delete bot', isLoading: false });
      throw error;
    }
  },
  
  startBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client
      const response = await BotsService.startBotById(id);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: state.bots.map((b: FrontendBot) => b.id === id ? bot : b),
        currentBot: state.currentBot?.id === id ? bot : state.currentBot,
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error(`Error starting bot ${id}:`, error);
      set({ error: 'Failed to start bot', isLoading: false });
      throw error;
    }
  },
  
  stopBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the TSOA-generated API client
      const response = await BotsService.stopBotById(id);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: state.bots.map((b: FrontendBot) => b.id === id ? bot : b),
        currentBot: state.currentBot?.id === id ? bot : state.currentBot,
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error(`Error stopping bot ${id}:`, error);
      set({ error: 'Failed to stop bot', isLoading: false });
      throw error;
    }
  },
  
  updateBotConfiguration: async (id: string, config: Partial<BotConfiguration>) => {
    const currentBot = get().currentBot;
    
    if (!currentBot) {
      throw new Error('No bot is currently selected');
    }
    
    const updatedConfig = {
      ...currentBot.configuration,
      ...config
    };
    
    return get().updateBot(id, { configuration: updatedConfig as any });
  },
  
  validateToken: async (token: string): Promise<TokenValidationResult> => {
    set({ isLoading: true, error: null });
    
    try {
      // Use direct API request since the validateDiscordBotToken endpoint isn't in the generated API
      const response = await request<TokenValidationResult>(OpenAPI, {
        method: 'POST',
        url: '/bots/validate-token',
        body: { token },
        mediaType: 'application/json',
      });
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      console.error('Error validating Discord token:', error);
      set({ error: 'Failed to validate token', isLoading: false });
      
      // Return a failed validation result when the API call fails
      return {
        valid: false,
        messageContentEnabled: false,
        error: error instanceof Error ? error.message : 'Unknown error validating token'
      };
    }
  }
}));
