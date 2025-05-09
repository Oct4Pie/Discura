import { create } from 'zustand';
import { BotStatus } from '../types';
import { Bot } from '../types';
import { botApi } from '../api';
import { CreateBotRequest } from '../api/generated/models/CreateBotRequest';
import { UpdateBotRequest } from '../api/generated/models/UpdateBotRequest';

// Define the bot configuration type for updates
interface BotConfiguration {
  systemPrompt?: string;
  personality?: string;
  traits?: string[];
  backstory?: string;
  llmProvider?: string;
  llmModel?: string;
  apiKey?: string;
  knowledge?: Array<{
    id?: string;
    name: string;
    content: string;
    type: string;
    source?: string;
  }>;
  imageGeneration?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    apiKey?: string;
  };
  toolsEnabled?: boolean;
  tools?: Array<{
    id: string;
    name: string;
    description: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
    }>;
    implementation?: string;
  }>;
}

interface BotsState {
  bots: Bot[];
  currentBot: Bot | null;
  isLoading: boolean;
  error: string | null;
  
  fetchBots: () => Promise<void>;
  fetchBot: (id: string) => Promise<void>;
  createBot: (botData: Partial<Bot>) => Promise<Bot>;
  updateBot: (id: string, botData: Partial<Bot>) => Promise<Bot>;
  deleteBot: (id: string) => Promise<void>;
  startBot: (id: string) => Promise<Bot>;
  stopBot: (id: string) => Promise<Bot>;
  updateBotConfiguration: (id: string, config: Partial<BotConfiguration>) => Promise<Bot>;
}

export const useBotStore = create<BotsState>((set, get) => ({
  bots: [],
  currentBot: null,
  isLoading: false,
  error: null,
  
  fetchBots: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await botApi.getUserBots();
      set({ bots: response.bots, isLoading: false });
    } catch (error) {
      console.error('Error fetching bots:', error);
      set({ error: 'Failed to fetch bots', isLoading: false });
    }
  },
  
  fetchBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await botApi.getBotById(id);
      set({ currentBot: response.bot, isLoading: false });
    } catch (error) {
      console.error(`Error fetching bot ${id}:`, error);
      set({ error: 'Failed to fetch bot details', isLoading: false });
    }
  },
  
  createBot: async (botData: Partial<Bot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await botApi.createBot(botData as CreateBotRequest);
      
      set(state => ({
        bots: [...state.bots, response],
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      console.error('Error creating bot:', error);
      set({ error: 'Failed to create bot', isLoading: false });
      throw error;
    }
  },
  
  updateBot: async (id: string, botData: Partial<Bot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await botApi.updateBot(id, botData as UpdateBotRequest);
      
      set(state => ({
        bots: state.bots.map((bot: Bot) => bot.id === id ? response : bot),
        currentBot: state.currentBot?.id === id ? response : state.currentBot,
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      console.error(`Error updating bot ${id}:`, error);
      set({ error: 'Failed to update bot', isLoading: false });
      throw error;
    }
  },
  
  deleteBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      await botApi.deleteBot(id);
      
      set(state => ({
        bots: state.bots.filter((bot: Bot) => bot.id !== id),
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
      // Use the generated API service
      const response = await botApi.startBot(id);
      
      set(state => ({
        bots: state.bots.map((bot: Bot) => bot.id === id ? response : bot),
        currentBot: state.currentBot?.id === id ? response : state.currentBot,
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      console.error(`Error starting bot ${id}:`, error);
      set({ error: 'Failed to start bot', isLoading: false });
      throw error;
    }
  },
  
  stopBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await botApi.stopBot(id);
      
      set(state => ({
        bots: state.bots.map((bot: Bot) => bot.id === id ? response : bot),
        currentBot: state.currentBot?.id === id ? response : state.currentBot,
        isLoading: false
      }));
      
      return response;
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
  }
}));
