import axios from 'axios';
import { create } from 'zustand';
import { BotStatus } from '../types';
import { Bot } from '../types';
import api from '../services/api';
import { API_ROUTES } from 'common';

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
      // Use our API service instead of axios directly
      const response = await api.get(API_ROUTES.BOTS.BASE);
      set({ bots: response.data.bots, isLoading: false });
    } catch (error) {
      console.error('Error fetching bots:', error);
      set({ error: 'Failed to fetch bots', isLoading: false });
    }
  },
  
  fetchBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use our API service
      const response = await api.get(API_ROUTES.BOTS.BY_ID(id));
      set({ currentBot: response.data.bot, isLoading: false });
    } catch (error) {
      console.error(`Error fetching bot ${id}:`, error);
      set({ error: 'Failed to fetch bot details', isLoading: false });
    }
  },
  
  createBot: async (botData: Partial<Bot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use our API service
      const response = await api.post(API_ROUTES.BOTS.BASE, botData);
      const newBot = response.data.bot;
      
      set(state => ({
        bots: [...state.bots, newBot],
        isLoading: false
      }));
      
      return newBot;
    } catch (error) {
      console.error('Error creating bot:', error);
      set({ error: 'Failed to create bot', isLoading: false });
      throw error;
    }
  },
  
  updateBot: async (id: string, botData: Partial<Bot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use our API service
      const response = await api.put(API_ROUTES.BOTS.BY_ID(id), botData);
      const updatedBot = response.data.bot;
      
      set(state => ({
        bots: state.bots.map((bot: Bot) => bot.id === id ? updatedBot : bot),
        currentBot: state.currentBot?.id === id ? updatedBot : state.currentBot,
        isLoading: false
      }));
      
      return updatedBot;
    } catch (error) {
      console.error(`Error updating bot ${id}:`, error);
      set({ error: 'Failed to update bot', isLoading: false });
      throw error;
    }
  },
  
  deleteBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use our API service
      await api.delete(API_ROUTES.BOTS.BY_ID(id));
      
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
      // Use our API service
      const response = await api.post(API_ROUTES.BOTS.START(id));
      const updatedBot = response.data.bot;
      
      set(state => ({
        bots: state.bots.map((bot: Bot) => bot.id === id ? { ...bot, status: BotStatus.ONLINE } : bot),
        currentBot: state.currentBot?.id === id ? updatedBot : state.currentBot,
        isLoading: false
      }));
      
      return updatedBot;
    } catch (error) {
      console.error(`Error starting bot ${id}:`, error);
      set({ error: 'Failed to start bot', isLoading: false });
      throw error;
    }
  },
  
  stopBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use our API service
      const response = await api.post(API_ROUTES.BOTS.STOP(id));
      const updatedBot = response.data.bot;
      
      set(state => ({
        bots: state.bots.map((bot: Bot) => bot.id === id ? { ...bot, status: BotStatus.OFFLINE } : bot),
        currentBot: state.currentBot?.id === id ? updatedBot : state.currentBot,
        isLoading: false
      }));
      
      return updatedBot;
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
